const form = document.getElementById('uploadForm');
const responseDiv = document.getElementById('responseDiv');
          
form.addEventListener('submit', function (event) {
    event.preventDefault();
            
    const formData = new FormData(form);
            
    fetch('/api/uploadfirmware', {
        method: 'POST',
        body: formData,
    }).then((response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        return reader.read().then(function processText({done, value}) {
            if (done) {
                document.getElementById('sub').disabled = false;
                return;
            }

            responseDiv.innerText = "Status: "+decoder.decode(value);

            return reader.read().then(processText);
        });
    });
});
