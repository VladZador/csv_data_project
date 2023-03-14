$(function() {
    $("#sortableList").sortable({
        axis: "y",
        containment: "#orderColumns",
        opacity: 0.6,
        cursor: 'move',
    });
});

function dataTypeClick(checkId, labelId, itemId, text) {
    const checkBox = document.getElementById(checkId);
    const label = document.getElementById(labelId);
    if (checkBox.checked === true){
        label.style.opacity = "1";
        const li = document.createElement("li");
        li.setAttribute("id", itemId);
        li.innerHTML = text;
        document.getElementById("sortableList").appendChild(li);
    } else {
        label.style.opacity = "0.5";
        document.getElementById(itemId).remove();
    }
}

function textOrIntegerClick(checkId, formId, labelId, itemId, text) {

    const checkBox = document.getElementById(checkId);
    const form = document.getElementById(formId);
    const label = document.getElementById(labelId);
    if (checkBox.checked === true){
        form.style.display = "inline";
        label.style.opacity = "1";
        const li = document.createElement("li");
        li.setAttribute("id", itemId);
        li.innerHTML = text;
        document.getElementById("sortableList").appendChild(li);
    } else {
        form.style.display = "none";
        label.style.opacity = "0.5";
        document.getElementById(itemId).remove();
        const forms = document.getElementById(formId).getElementsByTagName("input");
        for (let form of forms) {
            form.value = "";
        }
    }
}

function fullNameClick() {
    dataTypeClick("fullNameCheck", "fullNameLabel", "full-name", "Full name")
}

function jobClick() {
    dataTypeClick("jobCheck", "jobLabel", "job", "Job")
}

function emailClick() {
    dataTypeClick("emailCheck", "emailLabel", "email", "Email")
}

function domainClick() {
    dataTypeClick("domainCheck", "domainLabel", "domain-name", "Domain name")
}

function phoneClick() {
    dataTypeClick("phoneCheck", "phoneLabel", "phone-number", "Phone")
}

function companyClick() {
    dataTypeClick("companyCheck", "companyLabel", "company-name", "Company name")
}

function textClick() {
    textOrIntegerClick("textCheck", "textRangeForm", "textLabel", "text",
        "Text")
}

function integerClick() {
    textOrIntegerClick("integerCheck", "integerRangeForm", "integerLabel",
    "integer", "Integer")
}

function addressClick() {
    dataTypeClick("addressCheck", "addressLabel", "address", "Address")
}

function dateClick() {
    dataTypeClick("dateCheck", "dateLabel", "date", "Date")
}

function invalidInputReceived(form, textOrInt, minOrMax) {
    form.className = "invalid";
    form.value = "";
    form.placeholder = "Input must be a positive integer";
    document.getElementById(textOrInt).removeAttribute("data-" + textOrInt + minOrMax);
}

function textExceedMaxReceived(form, textOrInt, minOrMax) {
    form.className = "invalid";
    form.value = "";
    form.placeholder = "Should not exceed 100";
    document.getElementById(textOrInt).removeAttribute("data-" + textOrInt + minOrMax);
}

function validateTextOrIntForm (textOrInt) {
    const minForm = document.getElementById(textOrInt + "Min");
    const maxForm = document.getElementById(textOrInt + "Max");

    const minValue = minForm.value;
    const maxValue = maxForm.value;

    if (minValue == "" && maxValue == "") {
        document.getElementById(textOrInt).removeAttribute("data-" + textOrInt + "-min");
        document.getElementById(textOrInt).removeAttribute("data-" + textOrInt + "-max");
        
        return true;
    } else if (minValue == "") {
        if (isNaN(maxValue)){
            invalidInputReceived(maxForm, textOrInt, "-max");
            return false;
        }
        const max = parseFloat(maxValue);
        if (!(Number.isInteger(max)) || max <= 0) {
            invalidInputReceived(maxForm, textOrInt, "-max");
        } else {
            document.getElementById(textOrInt).removeAttribute("data-" + textOrInt + "-min");
            document.getElementById(textOrInt).setAttribute("data-" + textOrInt + "-max", max);
        }
    } else if (maxValue == "") {
        if (isNaN(minValue)){
            invalidInputReceived(minForm, textOrInt, "-min");
            return false;
        }
        const min = parseFloat(minValue);
        if (!(Number.isInteger(min)) || min <= 0) {
            invalidInputReceived(minForm, textOrInt, "-min");
        } else {
            document.getElementById(textOrInt).removeAttribute("data-" + textOrInt + "-max");
            document.getElementById(textOrInt).setAttribute("data-" + textOrInt + "-min", min);
        }
    } else {

        if (isNaN(minValue) || isNaN(maxValue)){
            if (isNaN(minValue)){
                invalidInputReceived(minForm, textOrInt, "-min");
            }
            if (isNaN(maxValue)){
                invalidInputReceived(maxForm, textOrInt, "-max");
            }
            return false;
        }

        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);

        if (!(Number.isInteger(min)) || !(Number.isInteger(max)) || min <= 0 || max <= 0) {
            if (!(Number.isInteger(min)) || min <= 0) {
                invalidInputReceived(minForm, textOrInt, "-min");
            }
            if (!(Number.isInteger(max)) || max <= 0) {
                invalidInputReceived(maxForm, textOrInt, "-max");
            }
        } else if (textOrInt === "text" && (min > 100 || max > 100)) {
            if (min > 100) {
                textExceedMaxReceived(minForm, textOrInt, "-min");
            }
            if (max > 100) {
                textExceedMaxReceived(maxForm, textOrInt, "-max");
            }
        } else if (max < min) {
            maxForm.className = "invalid";
            maxForm.value = "";
            maxForm.placeholder = "Max must be greater than min";
        } else {
            document.getElementById(textOrInt).setAttribute("data-" + textOrInt + "-min", min);
            document.getElementById(textOrInt).setAttribute("data-" + textOrInt + "-max", max);
        }
    }
    return true;
}

function goBack() {
    document.getElementById("chooseColumns").style.display = "block";
    document.getElementById("orderColumns").style.display = "none";
    document.getElementById("prevBtn").style.display = "none";
    document.getElementById("nextBtn").style.display = "inline";
    document.getElementById("confrmBtn").style.display = "none";
}

function goNext() {

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const checkedOne = Array.prototype.slice.call(checkboxes).some(x => x.checked);
    const invalidInputs = document.querySelector(".invalid")

    if (!checkedOne) {
        alert("Choose at least one column");
    } else if (invalidInputs) {
        alert("You have an invalid input");
    } else {
        document.getElementById("chooseColumns").style.display = "none";
        document.getElementById("orderColumns").style.display = "block";
        document.getElementById("prevBtn").style.display = "inline";
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("confrmBtn").style.display = "inline";
    }
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

    const orderedList = $("#sortableList").sortable("toArray");
    const schema = {orderedList: orderedList};

    const textElmnt = document.getElementById("text");
    const integerElmnt = document.getElementById("integer");

    if (!(textElmnt == null)) {
        if (textElmnt.hasAttribute("data-text-min")) {
            schema.textMin = textElmnt.dataset.textMin;
        }
        if (textElmnt.hasAttribute("data-text-max")) {
            schema.textMax = textElmnt.dataset.textMax;
        }
    }
    if (!(integerElmnt == null)) {
        if (integerElmnt.hasAttribute("data-integer-min")) {
            schema.integerMin = integerElmnt.dataset.integerMin;
        }
        if (integerElmnt.hasAttribute("data-integer-max")) {
            schema.integerMax = integerElmnt.dataset.integerMax;
        }
    }

    dataSchema.schema = schema;
    return dataSchema
}

function sendRequest() {

    const schemaName = validateSchemaName();

    if (!schemaName === false) {

        const dataSchema = createSchema(schemaName);

        const url = document.getElementById("confrmBtn").dataset.url;

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
