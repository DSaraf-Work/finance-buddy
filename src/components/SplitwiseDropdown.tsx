import { useState, useEffect, useRef } from 'react';

interface SplitwiseUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  picture?: string;
}

interface SplitwiseGroup {
  id: number;
  name: string;
  members: SplitwiseUser[];
  simplifyByDefault?: boolean;
  groupType?: string;
}

interface SplitwiseDropdownProps {
  transactionAmount: number;
  transactionDescription: string;
  transactionDate?: string;
  currencyCode?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  iconOnly?: boolean;
}

export default function SplitwiseDropdown({
  transactionAmount,
  transactionDescription,
  transactionDate,
  currencyCode = 'INR',
  onSuccess,
  onError,
  iconOnly = false,
}: SplitwiseDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'friends'>('groups');
  const [groups, setGroups] = useState<SplitwiseGroup[]>([]);
  const [friends, setFriends] = useState<SplitwiseUser[]>([]);
  const [currentUser, setCurrentUser] = useState<SplitwiseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<SplitwiseGroup | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<SplitwiseUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch data when dropdown opens
  useEffect(() => {
    if (isOpen && groups.length === 0 && friends.length === 0) {
      fetchSplitwiseData();
    }
  }, [isOpen]);

  const fetchSplitwiseData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [groupsRes, friendsRes, userRes] = await Promise.all([
        fetch('/api/splitwise/groups'),
        fetch('/api/splitwise/friends'),
        fetch('/api/splitwise/current-user'),
      ]);

      if (!groupsRes.ok || !friendsRes.ok || !userRes.ok) {
        throw new Error('Failed to fetch Splitwise data');
      }

      const [groupsData, friendsData, userData] = await Promise.all([
        groupsRes.json(),
        friendsRes.json(),
        userRes.json(),
      ]);

      setGroups(groupsData.groups || []);
      setFriends(friendsData.friends || []);
      setCurrentUser(userData.user || null);
    } catch (err: any) {
      console.error('Error fetching Splitwise data:', err);
      setError('Failed to load Splitwise data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (group: SplitwiseGroup) => {
    setSelectedGroup(group);
    setSelectedFriends([]);
  };

  const handleFriendToggle = (friend: SplitwiseUser) => {
    setSelectedGroup(null);
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.id === friend.id);
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id);
      }
      return [...prev, friend];
    });
  };

  const handleCreateSplit = async () => {
    if (!currentUser) {
      setError('Unable to get current user. Please try again.');
      return;
    }

    let participants: SplitwiseUser[] = [];
    let groupId: number | undefined;

    if (selectedGroup) {
      participants = selectedGroup.members;
      groupId = selectedGroup.id;
    } else if (selectedFriends.length > 0) {
      // Include current user + selected friends
      participants = [currentUser, ...selectedFriends];
    } else {
      setError('Please select a group or at least one friend');
      return;
    }

    // Calculate equal split
    const totalParticipants = participants.length;
    const equalShare = transactionAmount / totalParticipants;

    // Build splits: current user paid full amount, everyone owes equal share
    const splits = participants.map(participant => ({
      userId: participant.id,
      paidShare: participant.id === currentUser.id ? transactionAmount : 0,
      owedShare: equalShare,
    }));

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/splitwise/create-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: transactionDescription,
          cost: transactionAmount,
          currencyCode,
          date: transactionDate,
          groupId,
          splits,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to create expense');
      }

      // Success!
      setIsOpen(false);
      setSelectedGroup(null);
      setSelectedFriends([]);
      onSuccess?.();
    } catch (err: any) {
      console.error('Error creating Splitwise expense:', err);
      setError(err.message || 'Failed to create expense on Splitwise');
      onError?.(err.message || 'Failed to create expense on Splitwise');
    } finally {
      setCreating(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter(friend =>
    `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSelectionSummary = () => {
    if (selectedGroup) {
      return `Split with ${selectedGroup.members.length} people in "${selectedGroup.name}"`;
    }
    if (selectedFriends.length > 0) {
      const names = selectedFriends.map(f => f.firstName).join(', ');
      return `Split with ${names}`;
    }
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Split with Splitwise"
        className={iconOnly
          ? "w-10 h-10 flex items-center justify-center bg-emerald-600 rounded-full hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          : "inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-emerald-600 border border-transparent rounded-[var(--radius-md)] hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
        }
      >
        {/* Split/Users icon */}
        <svg className={iconOnly ? "w-5 h-5 text-white" : "w-4 h-4 mr-2"} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
        {!iconOnly && (
          <>
            Split with Splitwise
            <svg className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown Panel - Fixed center modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-zinc-900 border border-border rounded-xl shadow-2xl z-[101]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-semibold text-foreground">
              Split Expense on Splitwise
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {currencyCode} {transactionAmount.toFixed(2)} - {transactionDescription}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'groups'
                  ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Groups
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Friends
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-2">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Content */}
          <div className="max-h-60 overflow-y-auto px-2 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : error && !groups.length && !friends.length ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {error}
                <button
                  type="button"
                  onClick={fetchSplitwiseData}
                  className="block w-full mt-2 text-emerald-500 hover:text-emerald-400"
                >
                  Retry
                </button>
              </div>
            ) : activeTab === 'groups' ? (
              filteredGroups.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No groups found
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupSelect(group)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'bg-emerald-500/20 border border-emerald-500'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-foreground">{group.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {group.members.length} members
                      </div>
                    </div>
                    {selectedGroup?.id === group.id && (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))
              )
            ) : (
              filteredFriends.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No friends found
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isSelected = selectedFriends.some(f => f.id === friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleFriendToggle(friend)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/20 border border-emerald-500'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {friend.picture ? (
                        <img
                          src={friend.picture}
                          alt={friend.firstName}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-primary">
                            {friend.firstName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-foreground">
                          {friend.firstName} {friend.lastName}
                        </div>
                        {friend.email && (
                          <div className="text-xs text-muted-foreground">{friend.email}</div>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-border'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>

          {/* Selection Summary */}
          {getSelectionSummary() && (
            <div className="px-4 py-2 bg-emerald-500/10 border-t border-border">
              <p className="text-xs text-emerald-400">{getSelectionSummary()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Each person owes: {currencyCode} {(transactionAmount / (selectedGroup ? selectedGroup.members.length : selectedFriends.length + 1)).toFixed(2)}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-500/10 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSelectedGroup(null);
                setSelectedFriends([]);
                setSearchQuery('');
              }}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateSplit}
              disabled={creating || (!selectedGroup && selectedFriends.length === 0)}
              className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {creating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Split'
              )}
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
