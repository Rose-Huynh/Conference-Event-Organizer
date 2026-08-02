const finalizationApp = angular.module('finalizationApp', []);

finalizationApp.controller('FinalizationController', function ($scope, $http) {
  const finalizationEndpoint = '/api/finalizations';
  const sessionsEndpoint = '/api/sessions';
  const attendeesEndpoint = '/api/attendees';

  $scope.form = {
    fullName: '',
    email: '',
    participationType: '',
    sessionType: '',
    mealPreference: 'None',
    notes: '',
    confirmAttendance: false
  };

  $scope.errors = {};
  $scope.attendees = [];
  $scope.selectedAttendeeId = '';
  $scope.selectedSessions = [];
  $scope.sessions = [];
  $scope.filteredSessions = [];
  $scope.sessionTypes = [];
  $scope.finalizationJson = '{}';
  $scope.apiStatus = 'No API request sent yet.';
  $scope.apiStatusClass = 'text-muted';

  function normalizeSession(session) {
    return {
      sessionId: session.sessionId || session.productId || '',
      title: session.title || session.description || '',
      type: session.type || session.category || '',
      format: session.format || session.unitOfMeasure || ''
    };
  }

  function buildSessionTypes(sessionList) {
    const types = sessionList
      .map(function (session) {
        return session.type;
      })
      .filter(function (type) {
        return type !== '';
      });

    return [...new Set(types)].sort();
  }

  function loadSessions() {
    $http.get(sessionsEndpoint)
      .then(function (response) {
        $scope.sessions = response.data.map(normalizeSession);
        $scope.filteredSessions = $scope.sessions;
        $scope.sessionTypes = buildSessionTypes($scope.sessions);
        refreshJsonPreview();
      })
      .catch(function () {
        $scope.apiStatus = 'Could not load sessions from the Node API.';
        $scope.apiStatusClass = 'text-danger';
      });
  }

  function loadAttendees() {
    $http.get(attendeesEndpoint)
      .then(function (response) {
        $scope.attendees = response.data;
        refreshJsonPreview();
      })
      .catch(function () {
        $scope.apiStatus = 'Could not load attendees from the Node API.';
        $scope.apiStatusClass = 'text-danger';
      });
  }

  function isValidEmail(email) {
    return email.includes('@') && email.indexOf('@') > 0 && email.indexOf('@') < email.length - 1;
  }

  function buildFinalizationDocument() {
    return {
      finalizationId: 'FIN-' + Date.now(),
      attendeeId: $scope.selectedAttendeeId || 'N/A',
      fullName: $scope.form.fullName || 'N/A',
      email: $scope.form.email || 'N/A',
      participationType: $scope.form.participationType,
      preferredSessionType: $scope.form.sessionType,
      selectedSessions: $scope.selectedSessions.map(function (session) {
        return {
          sessionId: session.sessionId,
          title: session.title,
          type: session.type,
          format: session.format
        };
      }),
      mealPreference: $scope.form.mealPreference,
      finalNotes: $scope.form.notes.trim() || 'N/A',
      confirmedAttendance: $scope.form.confirmAttendance === true,
      submittedAt: new Date().toISOString()
    };
  }

  function validateFinalizationForm() {
    $scope.errors = {
      attendee: $scope.selectedAttendeeId === '',
      participationType: $scope.form.participationType === '',
      sessionType: $scope.form.sessionType === '',
      selectedSessions: $scope.selectedSessions.length === 0,
      confirmAttendance: $scope.form.confirmAttendance !== true
    };

    return !Object.values($scope.errors).some(Boolean) && isValidEmail($scope.form.email.trim());
  }

  function refreshJsonPreview() {
    const previewDocument = buildFinalizationDocument();
    $scope.finalizationJson = JSON.stringify(previewDocument, null, 2);
  }

  function showToast() {
    $('#successToast').fadeIn(200);

    setTimeout(function () {
      $('#successToast').fadeOut(200);
    }, 2500);
  }

  $scope.isSelected = function (session) {
    return $scope.selectedSessions.some(function (selectedSession) {
      return selectedSession.sessionId === session.sessionId;
    });
  };

  $scope.toggleSession = function (session) {
    if ($scope.isSelected(session)) {
      $scope.selectedSessions = $scope.selectedSessions.filter(function (selectedSession) {
        return selectedSession.sessionId !== session.sessionId;
      });
    } else {
      $scope.selectedSessions.push(session);
    }

    $scope.errors.selectedSessions = $scope.selectedSessions.length === 0;

    refreshJsonPreview();
  };

  $scope.loadSelectedAttendee = function () {
    const attendee = $scope.attendees.find(function (item) {
      return String(item.id) === String($scope.selectedAttendeeId);
    });

    if (!attendee) return;

    $scope.form.fullName = attendee.fullName;
    $scope.form.email = attendee.email;

    refreshJsonPreview();
  };

  $scope.submitFinalization = function (event) {
    event.preventDefault();

    if (!validateFinalizationForm()) {
      refreshJsonPreview();
      $scope.apiStatus = 'Please fix the form errors before submitting.';
      $scope.apiStatusClass = 'text-danger';
      return;
    }

    const finalizationDocument = buildFinalizationDocument();

    $scope.finalizationJson = JSON.stringify(finalizationDocument, null, 2);

    $scope.apiStatus = 'Sending finalization JSON to the Node REST API...';
    $scope.apiStatusClass = 'text-muted';

    $http.post(finalizationEndpoint, finalizationDocument)
      .then(function (response) {
        $scope.apiStatus = response.data.message;
        $scope.apiStatusClass = 'text-success';
      })
      .catch(function () {
        $scope.apiStatus = 'The Node REST API request could not be completed.';
        $scope.apiStatusClass = 'text-danger';
      });

    showToast();
  };

  $scope.resetForm = function () {
    $scope.form = {
      fullName: '',
      email: '',
      participationType: '',
      sessionType: '',
      mealPreference: 'None',
      notes: '',
      confirmAttendance: false
    };

    $scope.errors = {};
    $scope.selectedAttendeeId = '';
    $scope.selectedSessions = [];
    $scope.apiStatus = 'No API request sent yet.';
    $scope.apiStatusClass = 'text-muted';

    refreshJsonPreview();
  };

  $('#sessionSearch').on('keyup', function () {
    const searchTerm = $(this).val().toLowerCase();

    $scope.$apply(function () {
      $scope.filteredSessions = $scope.sessions.filter(function (session) {
        return (
          session.title.toLowerCase().includes(searchTerm) ||
          session.type.toLowerCase().includes(searchTerm) ||
          session.format.toLowerCase().includes(searchTerm)
        );
      });
    });
  });

  $scope.$watch('form', function () {
    refreshJsonPreview();
  }, true);

  loadAttendees();
  loadSessions();
  refreshJsonPreview();
});