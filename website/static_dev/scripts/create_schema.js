$(function() {
    $("#sortableList").sortable({
        axis: "y",
        containment: "#orderColumns",
        opacity: 0.6,
        cursor: 'move',
    });
});

function dataTypeClick(itemId, text) {
    const li = document.createElement("li");
    li.setAttribute("class", itemId);
    li.innerHTML = text;
    document.getElementById("sortableList").appendChild(li);
}

function textOrIntegerClick(itemId, text) {
    const li = document.createElement("li");
    li.setAttribute("class", itemId);
    li.innerHTML = text;

    const formId = itemId + "RangeForm";
    const formArray = document.getElementsByClassName(formId);

    const form = formArray[formArray.length - 1].cloneNode(true);
    li.appendChild(form);
    document.getElementById("sortableList").appendChild(li);
}

function fullNameClick() {
    dataTypeClick("full-name", "Full name")
}

function jobClick() {
    dataTypeClick("job", "Job")
}

function emailClick() {
    dataTypeClick("email", "Email")
}

function domainClick() {
    dataTypeClick("domain-name", "Domain name")
}

function phoneClick() {
    dataTypeClick("phone-number", "Phone")
}

function companyClick() {
    dataTypeClick("company-name", "Company name")
}

function textClick() {
    textOrIntegerClick("text", "Text")
}

function integerClick() {
    textOrIntegerClick("integer", "Integer")
}

function addressClick() {
    dataTypeClick("address", "Address")
}

function dateClick() {
    dataTypeClick("date", "Date")
}

function invalidInputReceived(form, li, minOrMax) {
    form.className = "invalid";
    form.value = "";
    form.placeholder = "Must be a positive integer";
    li.removeAttribute("data-" + minOrMax);
}

function textExceedMaxReceived(form, li,  minOrMax) {
    form.className = "invalid";
    form.value = "";
    form.placeholder = "Should not exceed 100";
    li.removeAttribute("data-" + minOrMax);
}

function validateTextOrIntForm(form, textOrInt) {

    const li = form.parentNode;

    const minForm = form.getElementsByClassName(textOrInt + "Min")[0];
    const maxForm = form.getElementsByClassName(textOrInt + "Max")[0];

    const minValue = minForm.value;
    const maxValue = maxForm.value;

    if (minValue == "" && maxValue == "") {
        li.removeAttribute("data-min");
        li.removeAttribute("data-max");
    } else if (minValue == "") {
        if (isNaN(maxValue)){
            invalidInputReceived(maxForm, li, "max");
            return false;
        }
        const max = parseFloat(maxValue);
        if (!(Number.isInteger(max)) || max <= 0) {
            invalidInputReceived(maxForm, li, "max");
        } else {
            li.removeAttribute("data-min");
            li.setAttribute("data-max", max);
        }
    } else if (maxValue == "") {
        if (isNaN(minValue)){
            invalidInputReceived(minForm, li, "min");
            return false;
        }
        const min = parseFloat(minValue);
        if (!(Number.isInteger(min)) || min <= 0) {
            invalidInputReceived(minForm, li, "min");
        } else {
            li.removeAttribute("data-max");
            li.setAttribute("data-min", min);
        }
    } else {

        if (isNaN(minValue) || isNaN(maxValue)){
            if (isNaN(minValue)){
                invalidInputReceived(minForm, li, "min");
            }
            if (isNaN(maxValue)){
                invalidInputReceived(maxForm, li, "max");
            }
            return false;
        }

        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);

        if (!(Number.isInteger(min)) || !(Number.isInteger(max)) || min <= 0 || max <= 0) {
            if (!(Number.isInteger(min)) || min <= 0) {
                invalidInputReceived(minForm, li, "min");
            }
            if (!(Number.isInteger(max)) || max <= 0) {
                invalidInputReceived(maxForm, li, "max");
            }
        } else if (textOrInt === "text" && (min > 100 || max > 100)) {
            if (min > 100) {
                textExceedMaxReceived(minForm, li, "min");
            }
            if (max > 100) {
                textExceedMaxReceived(maxForm, li, "max");
            }
        } else if (max < min) {
            maxForm.className = "invalid";
            maxForm.value = "";
            maxForm.placeholder = "Max must be greater than min";
        } else {
            li.setAttribute("data-min", min);
            li.setAttribute("data-max", max);
        }
    }
    return true;
}

function validateSchemaName() {
    let form = document.getElementById("schemaName");
    let schemaName = form.value;

    if (!(schemaName.match(/^[\w\s]+$/))) {
        form.className = "invalid";
        form.value = "";
        form.placeholder = "Input must be alphanumeric";
        return false
    } else {
        return schemaName
    }
}

function createSchema(name) {

    const list = document.getElementById("sortableList").children;
    if (list.length != 0) {
        const orderedList = [];
        for (let i = 0; i < list.length; i++) {
            const li = list[i];
            const className = li.className;

            const obj = {name: className, index: i};
            if (className == "text" || className == "integer") {
                if ("min" in li.dataset) {
                    obj.min = parseFloat(li.dataset.min);
                }
                if ("max" in li.dataset) {
                    obj.max = parseFloat(li.dataset.max);
                }
            }
            orderedList.push(obj);
        }
        const dataSchema = {name: name, schema: orderedList};
        return dataSchema
    } else {
        return false
    }
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

function sendRequest(dataSchema) {

    const url = document.getElementById("confirmButton").dataset.url;

    fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({"post_data":dataSchema}),
        redirect: "follow"
    })
        .then(response => response.json())
        .then(data => {
            location.assign(data.redirectUrl);
        })
}

function confirmCreation() {

    const schemaName = validateSchemaName();
    if (schemaName === false) {
        return false
    } 

    const dataSchema = createSchema(schemaName);
    if (dataSchema === false) {
        alert("You need to add columns to your data schema");
        return false
    }

    sendRequest(dataSchema);
}
