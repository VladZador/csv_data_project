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

    function padLeft(num) {
        const str = String(num);
        if (str.length == 1) {
            return "0" + str
        } else {
            return str
        }
    }
    const timestamp = [d.getFullYear(),
               padLeft(d.getMonth()+1),
               padLeft(d.getDate())].join('-') + '_' +
              [padLeft(d.getHours()),
               padLeft(d.getMinutes()),
               padLeft(d.getSeconds())].join(':');
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

function sendRequest(schemaName, number, filename) {

    const url = document.getElementById("generateBtn").dataset.url;

    const post_data = {schemaName: schemaName, number: number, filename: filename};

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
            changeUserFileElement(data.filename)
        })
}

function createUserFileElement(filename) {
    const td1 = document.createElement("td");
    td1.innerHTML = filename;

    const td2 = document.createElement("td");
    td2.setAttribute("class", "statusProcess");
    td2.innerHTML = "Processing";

    const td3 = document.createElement("td");
    td3.setAttribute("class", "link");

    const tr = document.createElement("tr");
    tr.setAttribute("id", filename);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);

    const tbody = document.getElementById("tableBody");
    if (tbody.childElementCount === 0) {
        tbody.appendChild(tr);
    } else {
        const firstChild = tbody.firstElementChild;
        tbody.insertBefore(tr, firstChild);
    }
}

function changeUserFileElement(filename) {
    const tr = document.getElementById(filename);
    const td2 = tr.getElementsByClassName("statusProcess")[0];
    td2.setAttribute("class", "statusReady");
    td2.innerHTML = "Ready";
    
    const href = document.createElement("a");
    href.setAttribute("class", "btn btn-primary");
    href.setAttribute("href", "/media/" + filename);
    href.setAttribute("role", "button");
    href.innerHTML = "Download";
    
    const td3 = tr.getElementsByClassName("link")[0];
    td3.appendChild(href);
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
    sendRequest(chosenSchemaName, recordsNumber, filename);
    createUserFileElement(filename);
}