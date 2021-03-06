window.onload = () => {
    if(localStorage.getItem('auth')) {
        let auth = document.getElementById('auth-text');
        auth.value = localStorage.getItem('auth');
    }
};

function paste() {
    let text = document.getElementById('textarea-text');
    let auth = document.getElementById('auth-text');
    let markdown = document.getElementById('markdown-check');
    if(!localStorage.getItem('auth')) localStorage.setItem('auth', auth.value);

    return fetch("/", {
        method: "POST",
        headers: { 'Content-Type': "application/json" },
        body: JSON.stringify({
            text: text.value,
            auth: auth.value,
            markdown: markdown.checked
        })
    }).then(r => r.json()).then(r =>
        Swal.fire({
            icon: (r.ok) ? "success" : "error",
            title: (r.ok) ? "Success!" : "Error!",
            html: r.message
        })
    ).catch(err => {
        console.error(err);
        return Swal.fire({
            icon: "error",
            title: "Error!",
            html: "Internal Client Error. Check the browser console."
        });
    });
};