import React from 'react';
import { SignedIn, SignedOut, SignInButton, useUser, SignOutButton, useAuth } from '@clerk/clerk-react';
import type { Question } from '../types';
import StudentYearSelect from './StudentYearSelect';
import type { StudentYear } from '../types';

interface AccountProps {
  onOpenQuestion: (q: Question) => void;
  postAnonymously: boolean;
  setPostAnonymously: (value: boolean) => void;
  selectedYears: StudentYear[];
  setSelectedYears: (value: StudentYear[]) => void;
}

const Account: React.FC<AccountProps> = ({ onOpenQuestion, postAnonymously, setPostAnonymously, selectedYears, setSelectedYears}) => {

  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const [loading, setLoading] = React.useState(false);
  const [activityAi, setActivityAi] = React.useState<Question[]>([]);
  const [activityDiscussion, setActivityDiscussion] = React.useState<Question[]>([]);
  const [bookmarks, setBookmarks] = React.useState<Question[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [draftAnon, setDraftAnon] = React.useState(postAnonymously);
  const [draftYears, setDraftYears] = React.useState<StudentYear[]>(selectedYears);
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);

  // Keep drafts in sync if App state changes (ex: login/logout)
  React.useEffect(() => setDraftAnon(postAnonymously), [postAnonymously]);
  React.useEffect(() => setDraftYears(selectedYears), [selectedYears]);

  React.useEffect(() => {

  }, []);

    const hasChanges =
    draftAnon !== postAnonymously ||
    JSON.stringify(draftYears) !== JSON.stringify(selectedYears);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMsg(null);

      const token = await getToken();
      if (!token) {
        setSaveMsg("Please sign in again.");
        return;
      }

      const res = await fetch('/api/me/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postAnonymously: draftAnon,
          studentYears: draftYears,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Save settings failed:", data);
        setSaveMsg("Failed to save. Please try again.");
        return;
      }

      // Update global app state AFTER server says OK
      setPostAnonymously(!!data.postAnonymously);
      setSelectedYears((data.studentYears ?? []) as StudentYear[]);
      setSaveMsg("Saved.");
    } catch (e) {
      console.error(e);
      setSaveMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAnonToggle = async (checked: boolean) => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/me/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postAnonymously: checked }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to update anonymous setting:', data);
        return;
      }

      // ✅ update global state so App + future posts stay in sync
      setPostAnonymously(data.postAnonymously);
    } catch (err) {
      console.error('Failed to update anonymous setting:', err);
    }
  };

  const fetchAllProfileData = React.useCallback(async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('Unable to verify your session. Please sign in again.');
        setLoading(false);
        return;
      }

      const [activityRes, bookmarksRes] = await Promise.all([
        fetch('/api/my/activity?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/bookmarks?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const activityJson = await activityRes.json();
      const bookmarksJson = await bookmarksRes.json();

      if (!activityRes.ok) {
        console.error('Activity load failed:', activityJson);
        setError('Failed to load your activity.');
      } else {
        setActivityAi(activityJson.aiQuestions ?? []);
        setActivityDiscussion(activityJson.discussionPosts ?? []);
      }

      if (!bookmarksRes.ok) {
        console.error('Bookmarks load failed:', bookmarksJson);
        setError((prev) => prev ?? 'Failed to load your bookmarks.');
      } else {
        setBookmarks(bookmarksJson.bookmarks ?? []);
      }
    } catch (e) {
      console.error(e);
      setError('Something went wrong loading your profile data.');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken]);

  React.useEffect(() => {
    if (isSignedIn) fetchAllProfileData();
  }, [isSignedIn, fetchAllProfileData]);

  const formatDate = (d: any) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleString();
    } catch {
      return '';
    }
  };

  const QuestionRow: React.FC<{ q: Question }> = ({ q }) => {
    const badge =
      q.type === 'ai'
        ? (q.status === 'answered' ? 'Verified Answer' : 'AI')
        : 'Discussion';

    return (
      <button
      type="button"
      onClick={() => onOpenQuestion(q)}
      className="w-full text-left">

        <div className="p-3 bg-white rounded-md border border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-gray-500 mb-1">{badge}{q.studentYear && q.studentYear !== 'All' ? ` • ${q.studentYear}` : ''}</div>
              <div className="text-gray-800 font-medium break-words">{q.questionText}</div>
              {q.type === 'ai' && q.aiAnswer ? (
                <div className="text-gray-700 text-sm mt-2 whitespace-pre-wrap break-words">
                  {q.aiAnswer}
                </div>
              ) : null}
              <div className="text-xs text-gray-500 mt-2">{formatDate(q.timestamp)}</div>
            </div>
            <div className="text-xs text-gray-600 whitespace-nowrap">
              👍 {q.upvotes ?? 0}
            </div>
          </div>
        </div>
    </button>
    );
  };

  if (!isLoaded) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <SignedOut>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account</h2>
        <p className="text-gray-600 mb-4">You are not signed in. Please sign in to view your profile.</p>
        <SignInButton mode="redirect">
          <button className="px-4 py-2 bg-red-800 text-white rounded-md">Sign In</button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">My Profile</h2>
            <p className="text-gray-600 text-sm">Your activity and bookmarks</p>
          </div>
          <div>
            <SignOutButton>
              <button className="px-3 py-2 bg-gray-100 border rounded text-sm">Sign out</button>
            </SignOutButton>
          </div>
        </div>

        {isSignedIn && user && (
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={(user as any).imageUrl || (user as any).profileImageUrl || '/assets/default-avatar.png'}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <div className="text-lg font-semibold text-gray-800">{user.fullName || user.firstName || 'User'}</div>
              <div className="text-sm text-gray-600">
                {user.primaryEmailAddress?.emailAddress || (user as any).emailAddresses?.[0]?.emailAddress}
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="mt-6 p-4 border rounded-lg bg-white">
          <div className="text-lg font-semibold text-gray-800 mb-1">Posting Privacy</div>
          <div className="text-sm text-gray-600 mb-3">
            When enabled, your discussions and comments will appear as <strong>Anonymous</strong>.
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={draftAnon}
              onChange={(e) => setDraftAnon(e.target.checked)}
              className="accent-red-700"
            />
            Post and comment anonymously
          </label>
        </div>

        <div className="mt-6 p-4 border rounded-lg bg-white">
          <div className="text-lg font-semibold text-gray-800 mb-1">Student Year Preferences</div>
          <div className="text-sm text-gray-600 mb-3">
            This affects what appears in your “Top Posts” sections.
          </div>

          <StudentYearSelect value={draftYears} onChange={setDraftYears} includeAll={true} />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-md text-white ${
              !hasChanges || saving ? 'bg-gray-400' : 'bg-red-800 hover:bg-red-900'
            }`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {saveMsg && <div className="text-sm text-gray-600">{saveMsg}</div>}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : ' '}
          </div>
          <button
            onClick={fetchAllProfileData}
            className="px-3 py-2 bg-gray-100 border rounded text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
            {error}
          </div>
        )}

        {/* Bookmarks */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-yellow-400">
            ⭐ Bookmarked Posts
          </h3>

          {bookmarks.length > 0 ? (
            <div className="space-y-3">
              {bookmarks.map((q) => (
                <QuestionRow key={`bm-${q.id}`} q={q} />
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500">No bookmarks yet.</p>
            </div>
          )}
        </div>

        {/* Activity */}
        <div>
          <h3 className="text-xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-red-200">
            My Activity
          </h3>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">AI Questions</h4>
            {activityAi.length > 0 ? (
              <div className="space-y-3">
                {activityAi.map((q) => (
                  <QuestionRow key={`ai-${q.id}`} q={q} />
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-500">No AI questions yet.</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Discussion Posts</h4>
            {activityDiscussion.length > 0 ? (
              <div className="space-y-3">
                {activityDiscussion.map((q) => (
                  <QuestionRow key={`disc-${q.id}`} q={q} />
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-500">No discussion posts yet.</p>
              </div>
            )}
          </div>
        </div>
      </SignedIn>
    </div>
  );
};

export default Account;