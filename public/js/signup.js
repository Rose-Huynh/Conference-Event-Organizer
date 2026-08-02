const attendeesEndpoint = '/api/attendees';
let attendees = [];

function normalizeAttendee(attendee, index) {
  return {
    id: attendee.id || Date.now() + index,
    fullName: attendee.fullName || attendee.name || '',
    email: attendee.email || '',
    phone: attendee.phone || 'N/A',
    age: Number(attendee.age) || 18,
    affiliation: attendee.affiliation || 'Other / Guest'
  };
}

function loadAttendees() {
  fetch(attendeesEndpoint)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Could not load attendees from API.');
      }

      return response.json();
    })
    .then(function (data) {
      attendees = data.map(normalizeAttendee);
      renderTable();
      renderJSON();
    })
    .catch(function () {
      renderTable();
      renderJSON();
      alert('Could not load attendees from the Node API.');
    });
}

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
  valid = showError(
    'age',
    'ageErr',
    !age || isNaN(ageNum) || ageNum < 1 || ageNum > 121 || !/^\d+$/.test(age)
  ) && valid;

  valid = showError('affiliation', 'affiliationErr', !affiliation) && valid;

  return valid;
}

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

  const requestMethod = editIndex >= 0 ? 'PUT' : 'POST';
  const requestUrl = editIndex >= 0
    ? attendeesEndpoint + '/' + encodeURIComponent(entry.id)
    : attendeesEndpoint;

  fetch(requestUrl, {
    method: requestMethod,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(entry)
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Could not save attendee.');
      }

      return response.json();
    })
    .then(function () {
      loadAttendees();
      resetForm();
      showToast();
    })
    .catch(function () {
      alert('Attendee could not be saved to the Node API.');
    });
}

function renderTable() {
  const tbody = document.getElementById('attendeeTable');
  document.getElementById('countBadge').textContent = attendees.length + ' registered';

  if (attendees.length === 0) {
    tbody.innerHTML = '<tr id="emptyRow"><td colspan="5" class="text-center text-muted py-4">No attendees registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = attendees.map(function (attendee, index) {
    return `
      <tr>
        <td><strong>${attendee.fullName}</strong></td>
        <td>${attendee.email}</td>
        <td>${attendee.age}</td>
        <td><span class="badge-role">${attendee.affiliation}</span></td>
        <td>
          <button class="btn-edit me-1" type="button" data-action="edit" data-index="${index}">Edit</button>
          <button class="btn-delete" type="button" data-action="delete" data-index="${index}">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderJSON() {
  document.getElementById('jsonViewer').textContent = JSON.stringify(attendees, null, 2);
}

function editAttendee(index) {
  const attendee = attendees[index];

  document.getElementById('fullName').value = attendee.fullName;
  document.getElementById('email').value = attendee.email;
  document.getElementById('phone').value = attendee.phone === 'N/A' ? '' : attendee.phone;
  document.getElementById('age').value = attendee.age;
  document.getElementById('affiliation').value = attendee.affiliation;
  document.getElementById('editIndex').value = index;
  document.getElementById('formTitle').textContent = 'Update Attendee';
  document.querySelector('.btn-submit').textContent = 'Save Changes';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteAttendee(index) {
  const attendee = attendees[index];

  if (confirm('Remove this attendee?')) {
    fetch(attendeesEndpoint + '/' + encodeURIComponent(attendee.id), {
      method: 'DELETE'
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Could not delete attendee.');
        }

        return response.json();
      })
      .then(function () {
        loadAttendees();
      })
      .catch(function () {
        alert('Attendee could not be deleted from the Node API.');
      });
  }
}

function resetForm() {
  ['fullName', 'email', 'phone', 'age'].forEach(function (id) {
    document.getElementById(id).value = '';
    document.getElementById(id).classList.remove('input-error');
  });

  document.getElementById('affiliation').value = '';
  document.getElementById('editIndex').value = '-1';
  document.getElementById('formTitle').textContent = 'Add Attendee';
  document.querySelector('.btn-submit').textContent = 'Add Attendee';

  ['nameErr', 'emailErr', 'phoneErr', 'ageErr', 'affiliationErr'].forEach(function (id) {
    document.getElementById(id).classList.remove('show');
  });
}

function showToast() {
  const toast = document.getElementById('successToast');

  toast.style.display = 'block';

  setTimeout(function () {
    toast.style.display = 'none';
  }, 2500);
}

function downloadJSON() {
  const blob = new Blob([JSON.stringify(attendees, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = 'attendees.json';
  link.click();
}

document.addEventListener('DOMContentLoaded', function () {
  loadAttendees();

  document.getElementById('submitAttendee').addEventListener('click', submitForm);
  document.getElementById('downloadJson').addEventListener('click', downloadJSON);

  document.getElementById('attendeeTable').addEventListener('click', function (event) {
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