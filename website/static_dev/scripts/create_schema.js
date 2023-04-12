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

    const form = document.getElementsByClassName(formId)[0].cloneNode(true)
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

function invalidInputReceived(form, li, textOrInt, minOrMax) {
    form.className = "invalid";
    form.value = "";
    form.placeholder = "Must be a positive integer";
    li.removeAttribute("data-" + textOrInt + minOrMax);
}

function textExceedMaxReceived(form, li, textOrInt, minOrMax) {
    form.className = "invalid";
    form.value = "";
    form.placeholder = "Should not exceed 100";
    li.removeAttribute("data-" + textOrInt + minOrMax);
}

function validateTextOrIntForm(form, textOrInt) {

    const li = form.parentNode;

    const minForm = form.getElementsByClassName(textOrInt + "Min")[0];
    const maxForm = form.getElementsByClassName(textOrInt + "Max")[0];

    const minValue = minForm.value;
    const maxValue = maxForm.value;

    if (minValue == "" && maxValue == "") {
        li.removeAttribute("data-" + textOrInt + "-min");
        li.removeAttribute("data-" + textOrInt + "-max");
    } else if (minValue == "") {
        if (isNaN(maxValue)){
            invalidInputReceived(maxForm, li, textOrInt, "-max");
            return false;
        }
        const max = parseFloat(maxValue);
        if (!(Number.isInteger(max)) || max <= 0) {
            invalidInputReceived(maxForm, li, textOrInt, "-max");
        } else {
            li.removeAttribute("data-" + textOrInt + "-min");
            li.setAttribute("data-" + textOrInt + "-max", max);
        }
    } else if (maxValue == "") {
        if (isNaN(minValue)){
            invalidInputReceived(minForm, li, textOrInt, "-min");
            return false;
        }
        const min = parseFloat(minValue);
        if (!(Number.isInteger(min)) || min <= 0) {
            invalidInputReceived(minForm, li, textOrInt, "-min");
        } else {
            li.removeAttribute("data-" + textOrInt + "-max");
            li.setAttribute("data-" + textOrInt + "-min", min);
        }
    } else {

        if (isNaN(minValue) || isNaN(maxValue)){
            if (isNaN(minValue)){
                invalidInputReceived(minForm, li, textOrInt, "-min");
            }
            if (isNaN(maxValue)){
                invalidInputReceived(maxForm, li, textOrInt, "-max");
            }
            return false;
        }

        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);

        if (!(Number.isInteger(min)) || !(Number.isInteger(max)) || min <= 0 || max <= 0) {
            if (!(Number.isInteger(min)) || min <= 0) {
                invalidInputReceived(minForm, li, textOrInt, "-min");
            }
            if (!(Number.isInteger(max)) || max <= 0) {
                invalidInputReceived(maxForm, li, textOrInt, "-max");
            }
        } else if (textOrInt === "text" && (min > 100 || max > 100)) {
            if (min > 100) {
                textExceedMaxReceived(minForm, li, textOrInt, "-min");
            }
            if (max > 100) {
                textExceedMaxReceived(maxForm, li, textOrInt, "-max");
            }
        } else if (max < min) {
            maxForm.className = "invalid";
            maxForm.value = "";
            maxForm.placeholder = "Max must be greater than min";
        } else {
            li.setAttribute("data-" + textOrInt + "-min", min);
            li.setAttribute("data-" + textOrInt + "-max", max);
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

function createSchema(name) {

    const dataSchema = {name: name};

    const list = document.getElementById("sortableList").children;
    const orderedList = [];
    for (let li of list) {
        const cl = li.className;
        if (cl == "text") {
            const obj = {name: cl};
            if ("textMin" in li.dataset) {
                obj.textMin = li.dataset.textMin;
            }
            if ("textMax" in li.dataset) {
                obj.textMax = li.dataset.textMax;
            }
            orderedList.push(obj);
        } else if (cl == "integer") {
            const obj = {name: cl};
            if ("integerMin" in li.dataset) {
                obj.integerMin = li.dataset.integerMin;
            }
            if ("integerMax" in li.dataset) {
                obj.integerMax = li.dataset.integerMax;
            }
            orderedList.push(obj);
        } else {
            orderedList.push(cl);
        }
    }

    dataSchema.schema = orderedList;
    return dataSchema
}

function sendRequest() {

    const schemaName = validateSchemaName();

    if (!schemaName === false) {

        const dataSchema = createSchema(schemaName);

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
}
