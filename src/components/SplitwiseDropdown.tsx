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
  transactionId?: string;
  existingExpenseId?: string | null;
  onExpenseCreated?: (expenseId: string) => void;
  disabled?: boolean;
}

export default function SplitwiseDropdown({
  transactionAmount,
  transactionDescription,
  transactionDate,
  currencyCode = 'INR',
  onSuccess,
  onError,
  iconOnly = false,
  transactionId,
  existingExpenseId,
  onExpenseCreated,
  disabled = false,
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
  const [selectedMembers, setSelectedMembers] = useState<SplitwiseUser[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<number, string>>({});
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

  // Initialize selected members and custom splits when group changes
  useEffect(() => {
    if (selectedGroup) {
      setSelectedMembers(selectedGroup.members);
      // Initialize custom splits with equal values
      const equalShare = transactionAmount / selectedGroup.members.length;
      const initialSplits: Record<number, string> = {};
      selectedGroup.members.forEach(m => {
        initialSplits[m.id] = equalShare.toFixed(2);
      });
      setCustomSplits(initialSplits);
      setSplitType('equal');
    } else {
      setSelectedMembers([]);
      setCustomSplits({});
      setSplitType('equal');
    }
  }, [selectedGroup, transactionAmount]);

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

  // Toggle member selection within a group
  const handleMemberToggle = (member: SplitwiseUser) => {
    // Don't allow deselecting current user (they are the payer)
    if (currentUser && member.id === currentUser.id) return;

    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      const newMembers = isSelected
        ? prev.filter(m => m.id !== member.id)
        : [...prev, member];

      // Recalculate equal splits for remaining members
      if (newMembers.length > 0) {
        const equalShare = transactionAmount / newMembers.length;
        const newSplits: Record<number, string> = {};
        newMembers.forEach(m => {
          newSplits[m.id] = equalShare.toFixed(2);
        });
        setCustomSplits(newSplits);
      }

      return newMembers;
    });
  };

  // Handle custom split amount change
  const handleCustomSplitChange = (userId: number, value: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: value,
    }));
  };

  // Calculate custom split total and validation
  const getCustomSplitTotal = () => {
    return Object.entries(customSplits)
      .filter(([id]) => selectedMembers.some(m => m.id === parseInt(id)))
      .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);
  };

  const isCustomSplitValid = () => {
    const total = getCustomSplitTotal();
    return Math.abs(total - transactionAmount) < 0.01;
  };

  const handleCreateSplit = async () => {
    if (!currentUser) {
      setError('Unable to get current user. Please try again.');
      return;
    }

    let participants: SplitwiseUser[] = [];
    let groupId: number | undefined;

    if (selectedGroup) {
      // Use selected members instead of all group members
      participants = selectedMembers;
      groupId = selectedGroup.id;

      // Validate minimum participants
      if (participants.length < 2) {
        setError('Please select at least 2 participants');
        return;
      }

      // Validate custom split total
      if (splitType === 'custom' && !isCustomSplitValid()) {
        setError(`Split amounts must equal ${currencyCode} ${transactionAmount.toFixed(2)}`);
        return;
      }
    } else if (selectedFriends.length > 0) {
      // Include current user + selected friends
      participants = [currentUser, ...selectedFriends];
    } else {
      setError('Please select a group or at least one friend');
      return;
    }

    // Build splits based on split type
    const splits = participants.map(participant => ({
      userId: participant.id,
      paidShare: participant.id === currentUser.id ? transactionAmount : 0,
      owedShare: splitType === 'custom' && selectedGroup
        ? parseFloat(customSplits[participant.id] || '0')
        : transactionAmount / participants.length,
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

      // Success! Extract expense ID from response
      const createdExpense = data.expenses?.[0] || data.expense;
      const expenseId = createdExpense?.id?.toString();

      if (expenseId) {
        onExpenseCreated?.(expenseId);
      }

      setIsOpen(false);
      setSelectedGroup(null);
      setSelectedFriends([]);
      setSelectedMembers([]);
      setSplitType('equal');
      setCustomSplits({});
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
    if (selectedGroup && selectedMembers.length > 0) {
      return `Split with ${selectedMembers.length} people in "${selectedGroup.name}"`;
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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title={disabled ? "Already split on Splitwise" : "Split with Splitwise"}
        className={iconOnly
          ? `w-10 h-10 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors ${
              disabled
                ? 'bg-emerald-600/50 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`
          : `inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] border border-transparent rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors ${
              disabled
                ? 'bg-emerald-600/50 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`
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
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-card border border-border rounded-xl shadow-2xl z-[101]">
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

          {/* Member Selection (only when group is selected) */}
          {selectedGroup && (
            <>
              <div className="border-t border-border">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Participants ({selectedMembers.length} of {selectedGroup.members.length})
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto px-2 py-1">
                  {selectedGroup.members.map((member) => {
                    const isSelected = selectedMembers.some(m => m.id === member.id);
                    const isCurrentUserMember = !!(currentUser && member.id === currentUser.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleMemberToggle(member)}
                        disabled={isCurrentUserMember}
                        className={`w-full flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                          isSelected ? 'bg-emerald-500/10' : 'hover:bg-muted'
                        } ${isCurrentUserMember ? 'cursor-default' : ''}`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors mr-3 ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-border'
                        } ${isCurrentUserMember ? 'opacity-60' : ''}`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-foreground flex-1 text-left">
                          {member.firstName} {member.lastName}
                          {isCurrentUserMember && (
                            <span className="text-xs text-muted-foreground ml-1">(You)</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Split Type Toggle */}
              <div className="flex border-t border-border">
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    splitType === 'equal'
                      ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Equal Split
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('custom')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    splitType === 'custom'
                      ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Custom Split
                </button>
              </div>

              {/* Custom Split Inputs */}
              {splitType === 'custom' && (
                <div className="px-4 py-3 border-t border-border bg-muted/30">
                  <div className="space-y-2">
                    {selectedMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">
                          {member.firstName}
                          {currentUser && member.id === currentUser.id && (
                            <span className="text-xs text-muted-foreground ml-1">(You)</span>
                          )}
                        </span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                            {currencyCode === 'INR' ? '₹' : currencyCode}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customSplits[member.id] || ''}
                            onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                            className="w-24 pl-6 pr-2 py-1 text-sm bg-background border border-border rounded-lg text-right text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className={`text-sm font-medium ${
                      isCustomSplitValid() ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {currencyCode} {getCustomSplitTotal().toFixed(2)}
                      {!isCustomSplitValid() && (
                        <span className="text-xs ml-1">
                          ({(transactionAmount - getCustomSplitTotal()) > 0 ? '+' : ''}
                          {(transactionAmount - getCustomSplitTotal()).toFixed(2)} remaining)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Selection Summary */}
          {(selectedGroup || selectedFriends.length > 0) && (
            <div className="px-4 py-2 bg-emerald-500/10 border-t border-border">
              <p className="text-xs text-emerald-400">{getSelectionSummary()}</p>
              {splitType === 'equal' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Each person owes: {currencyCode} {(transactionAmount / (selectedGroup ? selectedMembers.length : selectedFriends.length + 1)).toFixed(2)}
                </p>
              )}
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
                setSelectedMembers([]);
                setSplitType('equal');
                setCustomSplits({});
                setSearchQuery('');
              }}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateSplit}
              disabled={
                creating ||
                (!selectedGroup && selectedFriends.length === 0) ||
                !!(selectedGroup && selectedMembers.length < 2) ||
                !!(selectedGroup && splitType === 'custom' && !isCustomSplitValid())
              }
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
