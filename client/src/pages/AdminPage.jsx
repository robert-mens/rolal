import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Globe,
  ExternalLink,
  Search,
} from 'lucide-react';

/**
 * Separate Standalone Admin Page (/admin)
 * Connects directly to the main RolalBet backend & Aiven PostgreSQL to:
 * 1. Turn "UK-Only Location Protection" ON or OFF in real time
 * 2. View and manage all registered users (edit GBP £ balances, inspect registration type & team, delete accounts)
 * 3. View all created Teams and member counts
 */
export default function AdminPage() {
  const [ukOnlyEnabled, setUkOnlyEnabled] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [search, setSearch] = useState('');
  const [editingBalance, setEditingBalance] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const showNotice = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setUkOnlyEnabled(Boolean(data.ukOnlyEnabled));
        setCurrentLocation(data.currentLocation || null);
        setUsers(Array.isArray(data.users) ? data.users : []);
        setTeams(Array.isArray(data.teams) ? data.teams : []);
      }
    } catch (err) {
      showNotice('Failed to load admin overview', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleToggleUkProtection = async () => {
    setToggling(true);
    const nextState = !ukOnlyEnabled;
    try {
      const res = await fetch('/api/admin/uk-protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (res.ok) {
        const data = await res.json();
        setUkOnlyEnabled(Boolean(data.ukOnlyEnabled));
        showNotice(
          data.ukOnlyEnabled
            ? 'UK-Only Location Protection is now ON (Non-UK visitors blocked).'
            : 'UK-Only Location Protection is now OFF (All locations allowed).'
        );
      }
    } catch (err) {
      showNotice('Could not update UK protection setting', 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleSaveBalance = async (userId) => {
    const rawVal = editingBalance[userId];
    if (rawVal === undefined || rawVal === '' || isNaN(Number(rawVal))) return;
    setSavingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: Number(rawVal) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, balance: data.user.balance } : u)));
        setEditingBalance((prev) => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
        showNotice(`Updated balance for ${data.user.fullName} to £${Number(data.user.balance).toFixed(2)}.`);
      } else {
        showNotice(data.error || 'Failed to update balance', 'error');
      }
    } catch (err) {
      showNotice('Error updating user balance', 'error');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Delete user "${u.fullName}" (${u.email})?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(u.id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((item) => item.id !== u.id));
        showNotice(`Deleted user ${u.fullName}.`);
      }
    } catch (err) {
      showNotice('Failed to delete user', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      String(u.fullName || '').toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q) ||
      String(u.id || '').toLowerCase().includes(q) ||
      String(u.teamName || '').toLowerCase().includes(q) ||
      String(u.teamCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#111418] text-[#F8F9FA] font-sans">
      {/* Top Admin Header */}
      <header className="bg-[#1E222A] border-b border-[#2A2E35] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#161920] border border-[#2A2E35] flex items-center justify-center text-[#FFC107]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
                RolalBet Admin Console
              </h1>
              <span className="text-[11px] text-[#94A3B8] block">
                User Management & UK Geo-Protection Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchOverview}
              className="px-3 py-1.5 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] text-[#F8F9FA] text-[12px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <a
              href="/"
              className="px-3 py-1.5 rounded-[2px] bg-[#161920] hover:bg-[#232832] border border-[#2A2E35] text-[#FFC107] text-[12px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Open Sportsbook</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        {feedback && (
          <div
            className={[
              'p-3 rounded-[2px] border text-[12px] font-bold flex items-center gap-2',
              feedback.type === 'error'
                ? 'bg-[#1E222A] border-red-500 text-red-400'
                : 'bg-[#1E222A] border-[#00875A] text-[#00875A]',
            ].join(' ')}
          >
            {feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* 1. UK-ONLY LOCATION PROTECTION TOGGLE CARD */}
        <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#FFC107]" />
              <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
                UK-Only Location Protection
              </h2>
              <span
                className={[
                  'px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider',
                  ukOnlyEnabled
                    ? 'bg-[#00875A] text-white'
                    : 'bg-[#232832] text-[#94A3B8] border border-[#2A2E35]',
                ].join(' ')}
              >
                {ukOnlyEnabled ? 'Active (UK Only)' : 'Off (Global Access)'}
              </span>
            </div>
            <p className="text-[12px] text-[#94A3B8]">
              When enabled, anyone whose IP location is outside the United Kingdom (`GB` / `UK`) is blocked from accessing the sportsbook.
            </p>
            {currentLocation && (
              <p className="text-[11px] text-[#64748B]">
                Your detected location:{' '}
                <strong className="text-[#CBD5E1]">
                  {currentLocation.countryName} ({currentLocation.countryCode})
                </strong>
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={toggling}
            onClick={handleToggleUkProtection}
            className={[
              'px-4 py-2.5 rounded-[2px] text-[12px] font-bold uppercase tracking-wider shrink-0 transition-colors border',
              ukOnlyEnabled
                ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/40'
                : 'bg-[#00875A] hover:bg-[#00704A] text-white border-[#00875A]',
            ].join(' ')}
          >
            {toggling
              ? 'Updating...'
              : ukOnlyEnabled
                ? 'Turn Protection OFF'
                : 'Turn Protection ON'}
          </button>
        </div>

        {/* 2. USER MANAGEMENT TABLE */}
        <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FFC107]" />
              <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
                Registered Users ({users.length})
              </h2>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, team..."
                className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] pl-8 pr-3 py-1.5 text-[12px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-[#2A2E35] rounded-[2px] bg-[#161920]">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#2A2E35] bg-[#1E222A] text-[#94A3B8] uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Registration / Phone</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3">Balance (£)</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2E35]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const currentEdit =
                      editingBalance[u.id] !== undefined
                        ? editingBalance[u.id]
                        : String(Number(u.balance || 0).toFixed(2));
                    const isChanged =
                      editingBalance[u.id] !== undefined &&
                      Number(editingBalance[u.id]) !== Number(u.balance || 0);

                    return (
                      <tr key={u.id} className="hover:bg-[#1E222A]/60">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#F8F9FA]">{u.fullName}</div>
                          <div className="text-[11px] text-[#94A3B8]">
                            {u.email} • <span className="tabular-nums">{u.id}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          {u.registeredVia === 'team' || !u.phone ? (
                            <span className="px-2 py-0.5 rounded-[2px] bg-[#232832] border border-[#2A2E35] text-[10px] font-bold uppercase text-[#94A3B8]">
                              Joined via Team Code
                            </span>
                          ) : (
                            <div>
                              <span className="px-2 py-0.5 rounded-[2px] bg-[#00875A]/20 border border-[#00875A]/40 text-[10px] font-bold uppercase text-[#00875A]">
                                Phone Registered
                              </span>
                              <div className="text-[11px] text-[#94A3B8] tabular-nums mt-0.5">
                                {u.phone}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          {u.teamName || u.teamCode ? (
                            <div>
                              <div className="font-bold text-[#F8F9FA]">{u.teamName || 'Team'}</div>
                              <div className="text-[11px] text-[#FFC107] font-bold tabular-nums">
                                {u.teamCode}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#64748B] text-[11px]">No Team</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#94A3B8] font-bold">£</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentEdit}
                              onChange={(e) =>
                                setEditingBalance((prev) => ({
                                  ...prev,
                                  [u.id]: e.target.value,
                                }))
                              }
                              className="w-24 bg-[#111418] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-2 py-1 text-[12px] font-bold tabular-nums text-[#F8F9FA] focus:outline-none"
                            />
                            {isChanged && (
                              <button
                                type="button"
                                disabled={savingUserId === u.id}
                                onClick={() => handleSaveBalance(u.id)}
                                className="px-2.5 py-1 rounded-[2px] bg-[#00875A] hover:bg-[#00704A] text-white text-[11px] font-bold uppercase"
                              >
                                {savingUserId === u.id ? '...' : 'Save'}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-[2px] bg-[#232832] hover:bg-red-500/20 text-[#94A3B8] hover:text-red-400 border border-[#2A2E35] transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. CREATED TEAMS SUMMARY */}
        {teams.length > 0 && (
          <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-4 space-y-2.5">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#F8F9FA]">
              Created Teams ({teams.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {teams.map((t) => (
                <div
                  key={t.code}
                  className="p-3 rounded-[2px] bg-[#161920] border border-[#2A2E35] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#F8F9FA] text-[13px]">{t.name}</div>
                    <div className="text-[11px] text-[#94A3B8]">
                      Owner: {t.ownerName} • {t.memberCount} member{t.memberCount === 1 ? '' : 's'}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-[2px] bg-[#1E222A] border border-[#2A2E35] text-[#FFC107] font-bold text-[11px] tabular-nums">
                    {t.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
