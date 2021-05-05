require('dotenv-flow').config();
const fetch = require('node-fetch');
const marked = require('marked');

function makeID(length = 64) {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }

    return result.join('');
}

const mysql_con_data = process.env.MYSQL.split('^');
const con = require('mysql')
    .createPool({
        host: mysql_con_data[0],
        port: mysql_con_data[1],
        user: mysql_con_data[2],
        password: mysql_con_data[3],
        database: mysql_con_data[4],
        insecureAuth: true,
        charset: "utf8mb4"
    });

const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use('/static', express.static('static'));
app.use(express.json());

app.get('/', (req, res) => res.render('index'));
app.post('/', (req, res) => {
    let { text, auth, markdown } = req.body;
    if(!text || !auth) return res.json({ ok: false, message: "Text or authentification token isn't provided." });

    return con.query("SELECT * FROM tokens WHERE token = ?", [auth], (err, users) => {
        if(err) throw err;
        if(!users[0]) return res.json({ ok: false, message: "Authentification token isn't valid." });
        if(Boolean(users[0].isBanned)) return res.json({ ok: false, message: "You are banned." });

        let generatedID = makeID();
        return con.query("INSERT INTO paste (id, text, markdown, owner) VALUES (?, ?, ?, ?)", [generatedID, text, (Boolean(markdown)) ? 1 : 0, users[0].id], (err) => {
            if(err) throw err;
            let generatedCode = makeID(12);
            return fetch(
                `${process.env.LINKSHAPER_HOST}/api/create?code=${generatedCode}&access_token=${process.env.LINKSHAPER_TOKEN}&link=${process.env.APP_URL}/p/${generatedID}`,
            ).then(r => r.json()).then(r => {
                if(r.created) return res.json({ ok: true, message: `${process.env.LINKSHAPER_HOST}/${generatedCode}` });
                return res.json({ ok: true, message: `${process.env.APP_URL}/p/${generatedID}` });
            }).catch(console.error);
        });
    });
});

app.get('/p/:pasteID', (req, res) =>
    con.query("SELECT * FROM paste WHERE id = ?", [req.params.pasteID], (err, paste) => {
        if(err) throw err;
        if(!paste[0]) return res.render('error', { code: 404 });

        return res.render('view', { paste, marked });
    })
);

app.use((req, res, next) =>
    res.render('error', { code: 404 })
);

app.use((err, req, res, next) => {
    console.error(err.stack);
    return res.render('error', { code: 500 });
});

app.listen(process.env.PORT, () => console.info(`* Listening requests on *:${process.env.PORT}...`));