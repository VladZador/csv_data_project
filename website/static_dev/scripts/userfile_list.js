function validateRadio() {
    const radios = document.querySelectorAll('input[type="radio"]');
    const checkedOne = Array.prototype.slice.call(radios).some(x => x.checked);
    return checkedOne;
}

function invalidInputReceived(input) {
    input.className = "invalid";
    input.value = "";
    input.placeholder = "Input must be a positive integer";
}

function validateNumber() {
    const input = document.getElementById("recordsNumber");
    if (isNaN(input.value)){
        invalidInputReceived(input);
        return false;
    }

    const recordsNumber = parseFloat(input.value);
    if (!(Number.isInteger(recordsNumber)) || recordsNumber <= 0) {
        invalidInputReceived(input);
        return false;
    }
    return recordsNumber
}

function createFilename(schemaName, number) {
    const d = new Date;
    const timestamp = [d.getFullYear(),
               d.getMonth()+1,
               d.getDate()].join('-') + '_' +
              [d.getHours(),
               d.getMinutes(),
               d.getSeconds()].join(':');
    return schemaName + "-" + number + "_" + timestamp + ".csv"
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

function sendRequest(name, number, filename) {

    const url = document.getElementById("generateBtn").dataset.url;

    const post_data = {name: name, number: number, filename: filename};

    fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({"post_data": post_data}),
        redirect: "follow"
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
}

function createUserFileElement(filename) {
    const li = document.createElement("li");
        li.setAttribute("id", filename);
        li.innerHTML = filename;
        document.getElementById("userFiles").appendChild(li);
}

function generateData() {
    if (!validateRadio()) {
        alert("Choose data schema");
        return false;
    }
    const recordsNumber = validateNumber();
    if (!recordsNumber) {
        return false;
    }

    const chosenSchemaName = document.querySelector('input[name="schema"]:checked').value;

    const filename = createFilename(chosenSchemaName, recordsNumber);
    console.log(chosenSchemaName, recordsNumber, filename);
    sendRequest(chosenSchemaName, recordsNumber, filename);
    createUserFileElement(filename)
    console.log("done!");
}