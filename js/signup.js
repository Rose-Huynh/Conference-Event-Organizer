// this stores all registered users
let attendees = [];

function saveAttendees() {
  localStorage.setItem('techconnectAttendees', JSON.stringify(attendees, null, 2));
}

function loadAttendeesFromDataFile() {
  const savedAttendees = localStorage.getItem('techconnectAttendees');

  if (savedAttendees) {
    attendees = JSON.parse(savedAttendees);
  }

  renderTable();
  renderJSON();
}

// Shows or hides an error message for a form field
function showError(fieldId, errId, show) {
  const field = document.getElementById(fieldId);
  const err = document.getElementById(errId);

  if (show) {
    field.classList.add('input-error');
    err.classList.add('show');
  } else {
    field.classList.remove('input-error');
    err.classList.remove('show');
  }

  return !show;
}

// Validates name, email, phone, age, and affiliation before saving
function validateForm() {
  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const age = document.getElementById('age').value.trim();
  const affiliation = document.getElementById('affiliation').value;

  let valid = true;

  valid = showError('fullName', 'nameErr', !name || /\d/.test(name)) && valid;

  valid = showError(
    'email',
    'emailErr',
    !email || !email.includes('@') || email.indexOf('@') === 0 || email.indexOf('@') === email.length - 1
  ) && valid;

  if (phone !== '') {
    valid = showError('phone', 'phoneErr', !/^\d{10}$/.test(phone)) && valid;
  } else {
    showError('phone', 'phoneErr', false);
  }

  const ageNum = parseInt(age, 10);
  valid = showError('age', 'ageErr', !age || isNaN(ageNum) || ageNum < 1 || ageNum > 121 || !/^\d+$/.test(age)) && valid;

  valid = showError('affiliation', 'affiliationErr', !affiliation) && valid;

  return valid;
}

// Saves the form data into the attendees array as a JavaScript object
function submitForm() {
  if (!validateForm()) return;

  const editIndex = parseInt(document.getElementById('editIndex').value, 10);
  const entry = {
    id: editIndex >= 0 ? attendees[editIndex].id : Date.now(),
    fullName: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim() || 'N/A',
    age: parseInt(document.getElementById('age').value.trim(), 10),
    affiliation: document.getElementById('affiliation').value
  };

  if (editIndex >= 0) {
    attendees[editIndex] = entry;
  } else {
    attendees.push(entry);
  }

  saveAttendees();
  renderTable();
  renderJSON();
  resetForm();
  showToast();
}

// updates the attendee table to show all currently saved registrations
function renderTable() {
  const tbody = document.getElementById('attendeeTable');
  document.getElementById('countBadge').textContent = attendees.length + ' registered';

  if (attendees.length === 0) {
    tbody.innerHTML = '<tr id="emptyRow"><td colspan="5" class="text-center text-muted py-4">No attendees registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = attendees.map((a, i) => `
    <tr>
      <td><strong>${a.fullName}</strong></td>
      <td>${a.email}</td>
      <td>${a.age}</td>
      <td><span class="badge-role">${a.affiliation}</span></td>
      <td>
        <button class="btn-edit me-1" type="button" data-action="edit" data-index="${i}">Edit</button>
        <button class="btn-delete" type="button" data-action="delete" data-index="${i}">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Displays the saved attendees as JSON on the page
function renderJSON() {
  document.getElementById('jsonViewer').textContent = JSON.stringify(attendees, null, 2);
}

// loads a selected attendee's saved information back into the form so it can be edited
function editAttendee(index) {
  const a = attendees[index];
  document.getElementById('fullName').value = a.fullName;
  document.getElementById('email').value = a.email;
  document.getElementById('phone').value = a.phone === 'N/A' ? '' : a.phone;
  document.getElementById('age').value = a.age;
  document.getElementById('affiliation').value = a.affiliation;
  document.getElementById('editIndex').value = index;
  document.getElementById('formTitle').textContent = 'Update Attendee';
  document.querySelector('.btn-submit').textContent = 'Save Changes';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// removes a selected attendee after confirmation and refreshes the table and JSON display
function deleteAttendee(index) {
  if (confirm('Remove this attendee?')) {
    attendees.splice(index, 1);
    saveAttendees();
    renderTable();
    renderJSON();
  }
}

// clears the form fields, removes validation errors, and reset the form back to add mode.
function resetForm() {
  ['fullName', 'email', 'phone', 'age'].forEach(id => {
    document.getElementById(id).value = '';
    document.getElementById(id).classList.remove('input-error');
  });

  document.getElementById('affiliation').value = '';
  document.getElementById('editIndex').value = '-1';
  document.getElementById('formTitle').textContent = 'Add Attendee';
  document.querySelector('.btn-submit').textContent = 'Add Attendee';

  ['nameErr', 'emailErr', 'phoneErr', 'ageErr', 'affiliationErr'].forEach(id => {
    document.getElementById(id).classList.remove('show');
  });
}

// Briefly shows a success message after an attendee is saved.
function showToast() {
  const toast = document.getElementById('successToast');
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2500);
}

// downloads the current attendee list as the attendee JSON file
function downloadJSON() {
  const blob = new Blob([JSON.stringify(attendees, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'attendees.json';
  link.click();
}

document.addEventListener('DOMContentLoaded', () => {
  loadAttendeesFromDataFile();

  document.getElementById('submitAttendee').addEventListener('click', submitForm);
  document.getElementById('downloadJson').addEventListener('click', downloadJSON);

  document.getElementById('attendeeTable').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const index = parseInt(button.dataset.index, 10);
    if (button.dataset.action === 'edit') {
      editAttendee(index);
    }

    if (button.dataset.action === 'delete') {
      deleteAttendee(index);
    }
  });
});
