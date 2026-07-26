/* approval.js — Program committee review page for TechConnect 2026.
 *
 * React loads every proposal from the Node.js REST service over AJAX, renders
 * them, and sends the new status back when a reviewer approves or rejects one.
 *
 * While OFFLINE_MODE is true it reads and writes localStorage instead, using
 * the same key the proposal page writes to, so the two pages talk to each
 * other before the backend is ready.
 */

const API_BASE = 'http://localhost:3000';
const STORAGE_KEY = 'techconnectProposals';

// Flip to false once the Node service is running. Keep this matched with proposal.js.
const OFFLINE_MODE = true;

const FILTERS = ['pending', 'approved', 'rejected', 'all'];

// A couple of examples so the page isn't blank on a fresh browser.
const SEED_PROPOSALS = [
  {
    id: 1,
    title: 'Breaking and Fixing Your First Web App',
    abstract: 'A hands-on look at the most common web vulnerabilities, how attackers find them, and the small code changes that shut them down. Attendees follow along against a deliberately broken demo app.',
    speakerName: 'Jane Smith',
    speakerEmail: 'jane@psu.edu',
    category: 'Cybersecurity',
    format: 'Workshop',
    durationMinutes: 60,
    status: 'pending',
    submittedAt: '2026-07-24T14:05:00.000Z'
  },
  {
    id: 2,
    title: 'What Actually Changed in Frontend This Year',
    abstract: 'A practical tour of the frontend tooling that stuck around and the hype that did not, aimed at students who are about to pick a stack for their first internship project.',
    speakerName: 'Marcus Lee',
    speakerEmail: 'mlee@psu.edu',
    category: 'Web Development',
    format: 'Talk',
    durationMinutes: 30,
    status: 'pending',
    submittedAt: '2026-07-25T09:30:00.000Z'
  }
];

function readLocalProposals() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROPOSALS, null, 2));
      return SEED_PROPOSALS;
    }
    return JSON.parse(stored) || [];
  } catch (error) {
    return [];
  }
}

function writeLocalProposals(proposals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals, null, 2));
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return isNaN(date) ? 'N/A' : date.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function StatusBadge({ status }) {
  return <span className={'status-badge status-' + status}>{status}</span>;
}

function ProposalCard({ proposal, onDecide, busy }) {
  const [open, setOpen] = React.useState(false);
  const isPending = proposal.status === 'pending';

  return (
    <div className="proposal-card">
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div>
          <h3 className="proposal-title">{proposal.title}</h3>
          <p className="proposal-meta mb-0">
            {proposal.speakerName} · {proposal.speakerEmail}
          </p>
        </div>
        <StatusBadge status={proposal.status} />
      </div>

      <div className="proposal-tags">
        <span className="badge-type">{proposal.category}</span>
        <span className="badge-soft">{proposal.format}</span>
        <span className="badge-soft">{proposal.durationMinutes} min</span>
        <span className="badge-soft">Submitted {formatDate(proposal.submittedAt)}</span>
      </div>

      <p className={open ? 'proposal-abstract' : 'proposal-abstract clamped'}>
        {proposal.abstract}
      </p>
      <button className="link-button" type="button" onClick={() => setOpen(!open)}>
        {open ? 'Show less' : 'Read full abstract'}
      </button>

      <div className="proposal-actions">
        <button
          className="btn-approve"
          type="button"
          disabled={busy || proposal.status === 'approved'}
          onClick={() => onDecide(proposal.id, 'approved')}
        >
          Approve
        </button>
        <button
          className="btn-reject"
          type="button"
          disabled={busy || proposal.status === 'rejected'}
          onClick={() => onDecide(proposal.id, 'rejected')}
        >
          Reject
        </button>
        {!isPending && (
          <button
            className="link-button ms-2"
            type="button"
            disabled={busy}
            onClick={() => onDecide(proposal.id, 'pending')}
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

function ApprovalDashboard() {
  const [proposals, setProposals] = React.useState([]);
  const [filter, setFilter] = React.useState('pending');
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [toast, setToast] = React.useState('');

  // Load the list once when the page mounts.
  React.useEffect(() => { loadProposals(); }, []);

  async function loadProposals() {
    setLoading(true);
    setError('');

    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setProposals(readLocalProposals());
      } else {
        const response = await fetch(API_BASE + '/api/proposals');
        if (!response.ok) throw new Error('Server responded with ' + response.status);
        setProposals(await response.json());
      }
    } catch (err) {
      console.error(err);
      setError('Could not load proposals. Make sure the Node service is running, then reload.');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  // Send the new status to the backend, then update the list on screen.
  async function handleDecide(id, status) {
    setBusy(true);
    setError('');

    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const updated = proposals.map((item) =>
          item.id === id ? { ...item, status } : item
        );
        writeLocalProposals(updated);
        setProposals(updated);
      } else {
        const response = await fetch(API_BASE + '/api/proposals/' + id + '/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Server responded with ' + response.status);
        const saved = await response.json();
        setProposals(proposals.map((item) => (item.id === id ? saved : item)));
      }

      showToast(status === 'pending' ? 'Decision undone.' : 'Proposal ' + status + '.');
    } catch (err) {
      console.error(err);
      setError('Update failed. The proposal was not changed on the server.');
    } finally {
      setBusy(false);
    }
  }

  const counts = {
    pending: proposals.filter((p) => p.status === 'pending').length,
    approved: proposals.filter((p) => p.status === 'approved').length,
    rejected: proposals.filter((p) => p.status === 'rejected').length,
    all: proposals.length
  };

  const term = search.trim().toLowerCase();
  const visible = proposals
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => !term ||
      (p.title || '').toLowerCase().includes(term) ||
      (p.speakerName || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term));

  return (
    <React.Fragment>
      <div className="success-toast" style={{ display: toast ? 'block' : 'none' }}>
        ✅ {toast}
      </div>

      <div className="container py-5">

        <div className="review-toolbar">
          <div className="filter-group">
            {FILTERS.map((name) => (
              <button
                key={name}
                type="button"
                className={filter === name ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter(name)}
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
                <span className="filter-count">{counts[name]}</span>
              </button>
            ))}
          </div>

          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by title, speaker, or track…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="row g-4">
          <div className="col-lg-7 d-flex flex-column gap-3">
            {loading && <p className="text-muted py-4">Loading proposals…</p>}

            {!loading && visible.length === 0 && (
              <div className="empty-state">
                No proposals here yet. Submit one on the
                {' '}<a href="proposal.html">proposal page</a> and it will show up under Pending.
              </div>
            )}

            {!loading && visible.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onDecide={handleDecide}
                busy={busy}
              />
            ))}
          </div>

          <div className="col-lg-5">
            <div className="table-section">
              <h2 className="section-title mb-3">JSON Data Storage</h2>
              <p className="json-help-text text-muted mb-2">
                Live proposal data as returned by the Node.js service. Status values update
                here the moment a decision is saved.
              </p>
              <div className="json-box">{JSON.stringify(visible, null, 2)}</div>
            </div>
          </div>
        </div>

      </div>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('approvalRoot')).render(<ApprovalDashboard />);
