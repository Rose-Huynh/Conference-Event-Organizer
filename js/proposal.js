/* proposal.js — Session proposal submission page for TechConnect 2026.
 *
 * React manages the form state, validation runs client-side before anything
 * leaves the page, and the finished proposal is serialized to JSON and sent
 * to the Node.js REST service over AJAX.
 */

const API_BASE = 'http://localhost:3000';

const TRACKS = [
  'Web Development',
  'Cybersecurity',
  'Data & AI',
  'Cloud & DevOps',
  'Career & Community'
];

const FORMATS = ['Talk', 'Workshop', 'Panel', 'Showcase'];
const DURATIONS = [20, 30, 45, 60];

const EMPTY_FORM = {
  title: '',
  abstract: '',
  speakerName: '',
  speakerEmail: '',
  category: '',
  format: '',
  durationMinutes: ''
};

// Builds the JSON object that gets sent to the backend.
function buildProposal(form) {
  return {
    title: form.title.trim(),
    abstract: form.abstract.trim(),
    speakerName: form.speakerName.trim(),
    speakerEmail: form.speakerEmail.trim(),
    category: form.category,
    format: form.format,
    durationMinutes: Number(form.durationMinutes),
    status: 'pending',
    submittedAt: new Date().toISOString()
  };
}

// Every validation rule lives here so the checks stay in one place.
function validate(form) {
  const errors = {};
  const title = form.title.trim();
  const abstract = form.abstract.trim();
  const name = form.speakerName.trim();
  const email = form.speakerEmail.trim();

  if (!title) {
    errors.title = 'Session title is required.';
  } else if (title.length < 5) {
    errors.title = 'Title must be at least 5 characters.';
  } else if (title.length > 120) {
    errors.title = 'Title cannot be longer than 120 characters.';
  }

  if (!abstract) {
    errors.abstract = 'Abstract is required.';
  } else if (abstract.length < 50) {
    errors.abstract = 'Abstract must be at least 50 characters so reviewers have something to go on.';
  } else if (abstract.length > 1000) {
    errors.abstract = 'Abstract cannot be longer than 1000 characters.';
  }

  if (!name) {
    errors.speakerName = 'Speaker name is required.';
  } else if (/\d/.test(name)) {
    errors.speakerName = 'Speaker name must contain letters only (no numbers).';
  }

  if (!email) {
    errors.speakerEmail = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.speakerEmail = 'Please enter a valid email address.';
  }

  if (!form.category) errors.category = 'Please select a track.';
  if (!form.format) errors.format = 'Please select a session format.';
  if (!form.durationMinutes) errors.durationMinutes = 'Please select a session length.';

  return errors;
}

function ProposalForm() {
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [sending, setSending] = React.useState(false);
  const [failure, setFailure] = React.useState('');
  const [toast, setToast] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState(null);

  // One handler for every field, keyed off the input's name attribute.
  function handleChange(event) {
    const { name, value } = event.target;
    const next = { ...form, [name]: value };
    setForm(next);

    // Re-check a field as the user types, but only after they've left it once,
    // so errors don't appear while they're still filling it in.
    if (touched[name]) setErrors(validate(next));
  }

  function handleBlur(event) {
    setTouched({ ...touched, [event.target.name]: true });
    setErrors(validate(form));
  }

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser doing its own form submit

    const found = validate(form);
    setErrors(found);
    setTouched(Object.keys(EMPTY_FORM).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    // Nothing is sent while there are errors on the page.
    if (Object.keys(found).length > 0) {
      setFailure('Please fix the highlighted fields before submitting.');
      return;
    }

    const proposal = buildProposal(form);
    console.log('Proposal JSON being sent:', JSON.stringify(proposal, null, 2));

    setSending(true);
    setFailure('');

    try {
      // AJAX call to the Node.js REST service
      const response = await fetch(API_BASE + '/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal)
      });

      if (!response.ok) throw new Error('Server responded with ' + response.status);
      const saved = await response.json();

      setLastSaved(saved);
      setForm(EMPTY_FORM);
      setTouched({});
      setErrors({});
      showToast();
    } catch (error) {
      console.error(error);
      setFailure('Could not reach the server. Make sure the Node service is running, then try again.');
    } finally {
      setSending(false);
    }
  }

  function handleClear() {
    setForm(EMPTY_FORM);
    setErrors({});
    setTouched({});
    setFailure('');
  }

  // Adds the red border only once the field has been touched.
  function fieldClass(name, base) {
    return touched[name] && errors[name] ? base + ' input-error' : base;
  }

  function errorFor(name) {
    const show = touched[name] && errors[name];
    return <div className={show ? 'error-msg show' : 'error-msg'}>{errors[name] || ''}</div>;
  }

  const abstractLength = form.abstract.trim().length;
  const preview = buildProposal(form);

  return (
    <React.Fragment>
      <div className="success-toast" style={{ display: toast ? 'block' : 'none' }}>
        ✅ Proposal submitted — it's now pending review!
      </div>

      <div className="container py-5">
        <div className="row g-4">

          {/* ---------- Form ---------- */}
          <div className="col-lg-7">
            <div className="form-card">
              <h2 className="section-title mb-4">Proposal Details</h2>

              {failure && <div className="alert alert-danger py-2">{failure}</div>}

              <form noValidate onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label className="form-label" htmlFor="title">
                    Session Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className={fieldClass('title', 'form-control')}
                    placeholder="e.g. Breaking and Fixing Your First Web App"
                    value={form.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errorFor('title')}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="abstract">
                    Abstract <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="abstract"
                    name="abstract"
                    rows="6"
                    className={fieldClass('abstract', 'form-control')}
                    placeholder="What will attendees walk away knowing?"
                    value={form.abstract}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <div className="d-flex justify-content-between align-items-start">
                    {errorFor('abstract')}
                    <span className="char-count">{abstractLength} / 1000</span>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="speakerName">
                      Speaker Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="speakerName"
                      name="speakerName"
                      className={fieldClass('speakerName', 'form-control')}
                      placeholder="e.g. Jane Smith"
                      value={form.speakerName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errorFor('speakerName')}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="speakerEmail">
                      Contact Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="speakerEmail"
                      name="speakerEmail"
                      className={fieldClass('speakerEmail', 'form-control')}
                      placeholder="e.g. jane@psu.edu"
                      value={form.speakerEmail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errorFor('speakerEmail')}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-5 mb-3">
                    <label className="form-label" htmlFor="category">
                      Track <span className="text-danger">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      className={fieldClass('category', 'form-select')}
                      value={form.category}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <option value="">— Select a track —</option>
                      {TRACKS.map((track) => <option key={track} value={track}>{track}</option>)}
                    </select>
                    {errorFor('category')}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="format">
                      Format <span className="text-danger">*</span>
                    </label>
                    <select
                      id="format"
                      name="format"
                      className={fieldClass('format', 'form-select')}
                      value={form.format}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <option value="">— Select —</option>
                      {FORMATS.map((format) => <option key={format} value={format}>{format}</option>)}
                    </select>
                    {errorFor('format')}
                  </div>

                  <div className="col-md-3 mb-4">
                    <label className="form-label" htmlFor="durationMinutes">
                      Length <span className="text-danger">*</span>
                    </label>
                    <select
                      id="durationMinutes"
                      name="durationMinutes"
                      className={fieldClass('durationMinutes', 'form-select')}
                      value={form.durationMinutes}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <option value="">—</option>
                      {DURATIONS.map((minutes) => (
                        <option key={minutes} value={minutes}>{minutes} min</option>
                      ))}
                    </select>
                    {errorFor('durationMinutes')}
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-submit" type="submit" disabled={sending}>
                    {sending ? 'Submitting…' : 'Submit Proposal'}
                  </button>
                  <button
                    className="btn-clear"
                    type="button"
                    onClick={handleClear}
                    disabled={sending}
                  >
                    Clear Form
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* ---------- Live JSON + confirmation ---------- */}
          <div className="col-lg-5 d-flex flex-column gap-4">

            <div className="table-section">
              <h2 className="section-title mb-3">JSON Data Storage</h2>
              <p className="json-help-text text-muted mb-2">
                This is the JSON object that gets sent to the Node.js service as you type.
              </p>
              <div className="json-box">{JSON.stringify(preview, null, 2)}</div>
            </div>

            {lastSaved && (
              <div className="table-section">
                <h2 className="section-title mb-3">Last Submission</h2>
                <p className="json-help-text text-muted mb-2">
                  Response returned by the server after a successful POST.
                </p>
                <div className="json-box">{JSON.stringify(lastSaved, null, 2)}</div>
              </div>
            )}

          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('proposalRoot')).render(<ProposalForm />);
