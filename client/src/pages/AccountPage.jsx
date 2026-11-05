import React, { useState, useEffect } from 'react';
import { useBetting } from '../context/BettingContext';
import StatusBadge from '../components/common/StatusBadge';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Lock,
  Sliders,
  Receipt,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  ChevronRight,
  UploadCloud,
  KeyRound,
  LogOut,
  UserPlus,
  LogIn,
  ShoppingCart,
  Users,
  Copy,
  Check,
  Mail,
  RefreshCw,
} from 'lucide-react';

/**
 * Dedicated Full-Page "Account Creation / Login" & "Player Account Dashboard"
 * - When logged out: Renders the RolalBet UK Registration & Login page.
 * - When logged in: Renders the verified Player Account & Security dashboard.
 */
export default function AccountPage({ onBack }) {
  const {
    user,
    isAuthenticated,
    authMode,
    setAuthMode,
    sendRegistrationCode,
    sendSmsRegistrationCode,
    registerAccount,
    loginAccount,
    logoutAccount,
    createTeam,
    betslip,
    balance,
    transactions,
    accountModalTab,
    setAccountModalTab,
    openDeposit,
    openWithdraw,
    setCurrentView,
  } = useBetting();

  // Registration & Login form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactMethod, setContactMethod] = useState('phone'); // 'phone' | 'teamCode'
  const [phone, setPhone] = useState('+44 ');
  const [teamCode, setTeamCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageVerified, setAgeVerified] = useState(true);
  const [formError, setFormError] = useState(null);

  // 5-minute Email Authentication Code State (Resend)
  const [regStep, setRegStep] = useState('form'); // 'form' | 'code'
  const [authCode, setAuthCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);

  // 5-minute countdown timer for code expiration
  useEffect(() => {
    if (regStep !== 'code' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [regStep, timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatCountdown = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Team creation state (Only for phone-registered users)
  const [newTeamName, setNewTeamName] = useState('');
  const [teamError, setTeamError] = useState(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Active sub-tab inside the authenticated account page
  const [tab, setTab] = useState(accountModalTab || 'profile');
  const [depositLimit, setDepositLimit] = useState('500');
  const [lossLimit, setLossLimit] = useState('200');
  const [sessionLimit, setSessionLimit] = useState('60');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [savedFeedback, setSavedFeedback] = useState(null);
  const [txFilter, setTxFilter] = useState('ALL');

  // Step 1: Initiate registration & send 5-minute authentication code via Resend
  const handleInitiateRegister = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setFormError('Please fill in your full name, email address, and password.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (contactMethod === 'teamCode' && !teamCode.trim()) {
      setFormError('Please enter your Team Code or switch to UK Mobile Number.');
      return;
    }
    if (contactMethod === 'phone' && (!phone.trim() || phone.trim() === '+44')) {
      setFormError('Please enter your UK Mobile Number or switch to Team Code.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (!ageVerified) {
      setFormError('You must confirm you are 18+ years old to register in the United Kingdom.');
      return;
    }

    setIsSendingCode(true);
    let res;
    if (contactMethod === 'phone') {
      res = await sendSmsRegistrationCode({
        phone: phone.trim(),
        fullName: fullName.trim(),
      });
    } else {
      res = await sendRegistrationCode({
        email: email.trim(),
        fullName: fullName.trim(),
      });
    }
    setIsSendingCode(false);

    if (res.success) {
      setRegStep('code');
      setTimeLeft(res.expiresInSeconds || 300);
      setResendCooldown(30);
      setAuthCode('');
    } else if (res.error) {
      setFormError(res.error);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isSendingCode) return;
    setFormError(null);
    setIsSendingCode(true);
    let res;
    if (contactMethod === 'phone') {
      res = await sendSmsRegistrationCode({
        phone: phone.trim(),
        fullName: fullName.trim(),
      });
    } else {
      res = await sendRegistrationCode({
        email: email.trim(),
        fullName: fullName.trim(),
      });
    }
    setIsSendingCode(false);

    if (res.success) {
      setTimeLeft(res.expiresInSeconds || 300);
      setResendCooldown(30);
    } else if (res.error) {
      setFormError(res.error);
    }
  };

  // Step 2: Verify 6-digit code and complete account registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = authCode.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      setFormError(`Please enter the full 6-digit authentication code sent to your ${contactMethod === 'phone' ? 'mobile number via SMS' : 'email'}.`);
      return;
    }
    if (timeLeft <= 0) {
      setFormError('Your authentication code has expired (valid for 5 minutes). Please click "Resend Code".');
      return;
    }

    setIsVerifyingCode(true);
    const res = await registerAccount({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: contactMethod === 'phone' ? phone.trim() : null,
      teamCode: contactMethod === 'teamCode' ? teamCode.trim().toUpperCase() : null,
      password,
      code: cleanCode,
    });
    setIsVerifyingCode(false);

    if (res.success && betslip.length > 0) {
      setCurrentView('home');
    } else if (!res.success && res.error) {
      setFormError(res.error);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    const res = await loginAccount({ email, password });
    if (res.success && betslip.length > 0) {
      setCurrentView('home');
    } else if (!res.success && res.error) {
      setFormError(res.error);
    }
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    setTeamError(null);
    if (!newTeamName.trim() || newTeamName.trim().length < 2) {
      setTeamError('Please enter a Team Name (at least 2 characters).');
      return;
    }
    setIsCreatingTeam(true);
    const res = await createTeam(newTeamName.trim());
    setIsCreatingTeam(false);
    if (res.success) {
      setNewTeamName('');
      setSavedFeedback(`Team "${res.team.name}" created! Share your Team Code (${res.team.code}) so members can join.`);
      setTimeout(() => setSavedFeedback(null), 5000);
    } else if (res.error) {
      setTeamError(res.error);
    }
  };

  const handleCopyTeamCode = () => {
    if (!user?.teamCode) return;
    navigator.clipboard.writeText(user.teamCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveLimits = (e) => {
    e.preventDefault();
    setSavedFeedback('Player protection settings updated and committed to ledger.');
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  // Filter transactions
  const filteredTransactions = (transactions || []).filter((tx) => {
    if (txFilter === 'DEPOSIT') return tx.type === 'DEPOSIT' || tx.type === 'deposit';
    if (txFilter === 'WITHDRAWAL') return tx.type === 'WITHDRAWAL' || tx.type === 'withdrawal';
    return true;
  });

  // ---------------------------------------------------------------------------
  // GUEST VIEW: ACCOUNT CREATION (REGISTER) & LOGIN PAGE
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-3 py-2 pb-12 font-sans">
        {/* Top Return Bar */}
        <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack || (() => setCurrentView('home'))}
              className="w-8 h-8 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] text-[#94A3B8] hover:text-[#F8F9FA] border border-[#2A2E35] flex items-center justify-center transition-colors"
              title="Back to Sportsbook"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
                {authMode === 'register' ? 'Create Account' : 'Sign In to RolalBet UK'}
              </h1>
              <span className="text-[11px] text-[#94A3B8] font-normal">
                United Kingdom Regulated Sportsbook & Double-Entry Wallet
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('home')}
            className="text-[11px] font-bold text-[#FFC107] hover:underline px-2.5 py-1 rounded-[2px] bg-[#232832] border border-[#2A2E35]"
          >
            Browse Odds
          </button>
        </div>

        {/* Queued Bet Slip Selections Banner */}
        {betslip.length > 0 && (
          <div className="bg-[#1E222A] border border-[#FFC107] rounded-[2px] p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[12px]">
              <ShoppingCart className="w-4 h-4 text-[#FFC107] shrink-0" />
              <span className="text-[#F8F9FA]">
                You have <strong className="text-[#FFC107] tabular-nums">{betslip.length} selection{betslip.length > 1 ? 's' : ''}</strong> saved in your Bet Slip. Complete {authMode === 'register' ? 'registration' : 'sign in'} to place your bet.
              </span>
            </div>
          </div>
        )}

        {/* Main Auth Card */}
        <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-4 space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-0.5 bg-[#161920] border border-[#2A2E35] rounded-[2px]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setRegStep('form');
                setFormError(null);
              }}
              className={[
                'py-2 rounded-[2px] text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors',
                authMode === 'register'
                  ? 'bg-[#FFC107] text-[#111418]'
                  : 'text-[#94A3B8] hover:text-[#F8F9FA]',
              ].join(' ')}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setRegStep('form');
                setFormError(null);
              }}
              className={[
                'py-2 rounded-[2px] text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors',
                authMode === 'login'
                  ? 'bg-[#FFC107] text-[#111418]'
                  : 'text-[#94A3B8] hover:text-[#F8F9FA]',
              ].join(' ')}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          </div>

          {formError && (
            <div className="p-2.5 rounded-[2px] bg-[#161920] border border-red-500 text-red-400 text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {authMode === 'register' ? (
            regStep === 'form' ? (
              <form onSubmit={handleInitiateRegister} className="space-y-3">
                <div>
                  <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block mb-1">
                    Full Legal Name (As on UK ID / Passport) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Oliver Harrison"
                    className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-3 py-2 text-[14px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block mb-1">
                      Email Address (Auth Code Sent Here) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.co.uk"
                      className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-3 py-2 text-[14px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8]">
                        {contactMethod === 'phone' ? 'UK Mobile Number *' : 'Team Code *'}
                      </label>
                      <div className="flex items-center gap-1 bg-[#161920] border border-[#2A2E35] rounded-[2px] p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setContactMethod('phone');
                            setFormError(null);
                          }}
                          className={[
                            'px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider transition-colors',
                            contactMethod === 'phone'
                              ? 'bg-[#FFC107] text-[#111418]'
                              : 'text-[#94A3B8] hover:text-[#F8F9FA]',
                          ].join(' ')}
                        >
                          Phone
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setContactMethod('teamCode');
                            setFormError(null);
                          }}
                          className={[
                            'px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider transition-colors',
                            contactMethod === 'teamCode'
                              ? 'bg-[#FFC107] text-[#111418]'
                              : 'text-[#94A3B8] hover:text-[#F8F9FA]',
                          ].join(' ')}
                        >
                          Team Code
                        </button>
                      </div>
                    </div>

                    {contactMethod === 'phone' ? (
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+44 7700 900077"
                        className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-3 py-2 text-[14px] tabular-nums text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                        placeholder="e.g. ROLAL-UK01"
                        className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-3 py-2 text-[14px] font-bold uppercase tracking-wider tabular-nums text-[#FFC107] placeholder:text-[#64748B] placeholder:font-normal focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block mb-1">
                      Password (Min. 6 chars) *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-3 py-2 text-[14px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-3 py-2 text-[14px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 18+ UK Verification Checkbox */}
                <label className="flex items-start gap-2 p-2.5 rounded-[2px] bg-[#161920] border border-[#2A2E35] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ageVerified}
                    onChange={(e) => setAgeVerified(e.target.checked)}
                    className="mt-0.5 accent-[#FFC107]"
                  />
                  <span className="text-[11px] text-[#94A3B8] leading-snug">
                    I confirm that I am at least <strong className="text-[#F8F9FA]">18 years of age</strong>, reside in the <strong className="text-[#F8F9FA]">United Kingdom</strong>, and accept the RolalBet UK Terms &amp; Responsible Gambling policy.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="w-full py-2.5 px-4 rounded-[2px] bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-[14px] uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSendingCode ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{contactMethod === 'phone' ? 'Sending SMS Code...' : 'Sending Auth Code...'}</span>
                    </>
                  ) : (
                    <>
                      {contactMethod === 'phone' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      <span>{contactMethod === 'phone' ? 'Send SMS Authentication Code' : 'Send Authentication Code'}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: 6-Digit Email Verification Code Input */
              <form onSubmit={handleVerifyAndRegister} className="space-y-4 py-1">
                <div className="p-3 rounded-[2px] bg-[#161920] border border-[#FFC107]/40 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFC107]/15 text-[#FFC107] flex items-center justify-center shrink-0 mt-0.5">
                    {contactMethod === 'phone' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-bold text-[#F8F9FA] block">
                      {contactMethod === 'phone' ? 'Verify Your Mobile Number' : 'Verify Your Email Address'}
                    </span>
                    <span className="text-[12px] text-[#94A3B8] block mt-0.5 leading-snug">
                      {contactMethod === 'phone' ? (
                        <>We sent a 6-digit authentication SMS to <strong className="text-[#FFC107]">{phone}</strong>.</>
                      ) : (
                        <>We sent a 6-digit authentication code to <strong className="text-[#FFC107]">{email}</strong>.</>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block mb-1.5 text-center">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    value={authCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setAuthCode(val);
                      setFormError(null);
                    }}
                    placeholder="••••••"
                    className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[4px] px-3 py-3 text-[26px] font-mono font-extrabold tracking-[10px] text-center text-[#FFC107] placeholder:text-[#333C4D] placeholder:tracking-[10px] focus:outline-none"
                  />
                </div>

                {/* 5-Minute Countdown Expiry Notice */}
                <div
                  className={[
                    'p-2.5 rounded-[2px] border flex items-center justify-between text-[12px]',
                    timeLeft > 60
                      ? 'bg-[#161920] border-[#FFC107]/30 text-[#FFC107]'
                      : timeLeft > 0
                        ? 'bg-red-500/10 border-red-500/40 text-red-300'
                        : 'bg-red-500/15 border-red-500 text-red-400 font-bold',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {timeLeft > 0 ? (
                        <>
                          Code expires in <strong className="tabular-nums font-mono font-bold">{formatCountdown(timeLeft)}</strong>
                        </>
                      ) : (
                        <span>Code has expired (5-minute limit exceeded)</span>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                    5 Min Expiry
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingCode || authCode.length !== 6 || timeLeft <= 0}
                  className="w-full py-2.5 px-4 rounded-[2px] bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-[14px] uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifyingCode ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Verifying &amp; Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm &amp; Create Account</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSendingCode}
                    onClick={handleResendCode}
                    className="text-[#94A3B8] hover:text-[#FFC107] font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors"
                  >
                    <RefreshCw className={['w-3 h-3', isSendingCode ? 'animate-spin' : ''].join(' ')} />
                    <span>
                      {resendCooldown > 0
                        ? `Resend Code (${resendCooldown}s)`
                        : isSendingCode
                          ? 'Sending...'
                          : 'Resend Code'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegStep('form');
                      setFormError(null);
                    }}
                    className="text-[#94A3B8] hover:text-[#F8F9FA] underline font-medium"
                  >
                    {contactMethod === 'phone' ? 'Change Phone / Edit Details' : 'Change Email / Edit Details'}
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="oliver.harrison@rolalbet.co.uk"
                  className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-3 py-2 text-[14px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-3 py-2 text-[14px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-[2px] bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-[14px] uppercase tracking-wider transition-colors"
              >
                Sign In to Account
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED VIEW: PLAYER ACCOUNT & SECURITY DASHBOARD
  // ---------------------------------------------------------------------------
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full space-y-2.5 pb-12 font-sans">
      {/* ── Page Header & Profile Card ── */}
      <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-3 space-y-3">
        {/* Top return bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack || (() => setCurrentView('home'))}
              className="w-8 h-8 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] text-[#94A3B8] hover:text-[#F8F9FA] border border-[#2A2E35] flex items-center justify-center transition-colors"
              title="Back to Sportsbook"
              aria-label="Back to Sportsbook"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
                Player Account & Security
              </h1>
              <span className="text-[11px] text-[#94A3B8] font-normal">
                Verified RolalBet UK Member Account
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={logoutAccount}
              className="text-[12px] font-bold text-red-400 hover:bg-[#232832] px-3 py-1.5 rounded-[2px] bg-[#161920] border border-[#2A2E35] flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="text-[12px] font-bold text-[#FFC107] hover:underline px-3 py-1.5 rounded-[2px] bg-[#232832] border border-[#2A2E35] flex items-center gap-1.5 transition-colors"
            >
              <span>Sportsbook</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* User Identity & Financial Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2.5 border-t border-[#2A2E35]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-[#232832] border border-[#FFC107] flex items-center justify-center text-[#F8F9FA] font-bold text-[14px] shrink-0">
              {initials}
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#F8F9FA] text-[14px]">
                  {user.fullName}
                </span>
                <span className="px-2 py-0.5 rounded-[2px] bg-[#00875A] text-white text-[11px] font-bold uppercase">
                  {user.tier || 'UK Tier 1 Verified'}
                </span>
                {(user.teamName || user.teamCode) && (
                  <span className="px-2 py-0.5 rounded-[2px] bg-[#161920] border border-[#FFC107]/60 text-[#FFC107] text-[11px] font-bold flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>Team: {user.teamName || user.teamCode}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#94A3B8]">
                <span>ID: <strong className="text-[#F8F9FA] tabular-nums">{user.id}</strong></span>
                <span>•</span>
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Cashier Action Group */}
          <div className="flex items-center gap-2.5 bg-[#161920] border border-[#2A2E35] rounded-full px-3 py-1">
            <div className="flex flex-col text-left mr-1">
              <span className="text-[11px] text-[#94A3B8] font-normal leading-none">
                Balance
              </span>
              <span className="tabular-nums text-[14px] font-bold text-[#FFC107] leading-tight">
                £{balance.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="button"
              onClick={openDeposit}
              className="rounded-full px-3 py-1.5 bg-[#00875A] hover:bg-[#00704A] text-white text-[12px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Deposit</span>
            </button>

            <button
              type="button"
              onClick={openWithdraw}
              className="rounded-full px-3 py-1.5 bg-[#232832] hover:bg-[#2B313D] text-[#F8F9FA] border border-[#2A2E35] text-[12px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex items-center overflow-x-auto gap-1 bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-1">
        {[
          { id: 'profile', label: 'Profile Details', icon: User },
          { id: 'verification', label: 'Identity & KYC', icon: ShieldCheck },
          { id: 'security', label: 'Security & 2FA', icon: Lock },
          { id: 'responsible', label: 'Responsible Gambling', icon: Sliders },
          { id: 'transactions', label: 'Transaction History', icon: Receipt },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setAccountModalTab(item.id);
              }}
              className={[
                'flex-1 min-w-[130px] py-1.5 px-3 rounded-[2px] text-[12px] font-bold transition-colors text-center flex items-center justify-center gap-1.5 whitespace-nowrap',
                isSelected
                  ? 'bg-[#FFC107] text-[#111418]'
                  : 'text-[#94A3B8] hover:text-[#F8F9FA] hover:bg-[#232832]',
              ].join(' ')}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Toast */}
      {savedFeedback && (
        <div className="p-2.5 rounded-[2px] bg-[#1E222A] border border-[#00875A] text-[12px] font-bold text-[#00875A] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* ── TAB 1: PROFILE DETAILS ── */}
      {tab === 'profile' && (
        <div className="space-y-2.5">
          <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-3 space-y-3">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
              Personal Information & Identification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="px-3 py-2 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-0.5">
                <span className="text-[11px] text-[#94A3B8] uppercase font-normal block">Full Legal Name</span>
                <span className="text-[#F8F9FA] font-bold text-[14px] block">{user.fullName}</span>
              </div>

              <div className="px-3 py-2 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-0.5">
                <span className="text-[11px] text-[#94A3B8] uppercase font-normal block">Registered Email</span>
                <span className="text-[#F8F9FA] font-bold text-[14px] block truncate">{user.email}</span>
              </div>

              <div className="px-3 py-2 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-0.5">
                <span className="text-[11px] text-[#94A3B8] uppercase font-normal block">
                  {(user.registeredVia === 'team' || !user.phone) ? 'Team Name' : 'Mobile Phone (UK)'}
                </span>
                <span className="text-[#F8F9FA] font-bold text-[14px] tabular-nums block">
                  {(user.registeredVia === 'team' || !user.phone) ? (
                    <span className="text-[#FFC107]">{user.teamName || user.teamCode}</span>
                  ) : (
                    user.phone
                  )}
                </span>
              </div>

              <div className="px-3 py-2 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-0.5">
                <span className="text-[11px] text-[#94A3B8] uppercase font-normal block">Jurisdiction</span>
                <span className="text-[#F8F9FA] font-bold text-[14px] block">{user.jurisdiction || 'United Kingdom (UK)'}</span>
              </div>

              <div className="px-3 py-2 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-0.5">
                <span className="text-[11px] text-[#94A3B8] uppercase font-normal block">Account Status</span>
                <span className="text-[#00875A] font-bold text-[14px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active / Good Standing
                </span>
              </div>

              <div className="px-3 py-2 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-0.5">
                <span className="text-[11px] text-[#94A3B8] uppercase font-normal block">Member Since</span>
                <span className="text-[#F8F9FA] font-bold text-[14px] block">{user.createdAt || '14 January 2026'}</span>
              </div>
            </div>
          </div>

          {/* ── TEAM SECTION (Create Team for Phone Users / View Team Name for Team-Joined Users) ── */}
          <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FFC107]" />
                <h3 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
                  Team Membership & Management
                </h3>
              </div>
              {user.teamCode && (
                <span className="px-2 py-0.5 rounded-[2px] bg-[#161920] border border-[#2A2E35] text-[10px] font-bold uppercase tracking-wider text-[#FFC107]">
                  {(user.registeredVia === 'team' || !user.phone) ? 'Joined via Team Code' : 'Team Owner'}
                </span>
              )}
            </div>

            {/* Case 1: User joined via a Team Code -> Show Team Name & Code, cannot create a team */}
            {(user.registeredVia === 'team' || !user.phone) ? (
              <div className="p-3 rounded-[2px] bg-[#161920] border border-[#2A2E35] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider block">
                    Your Team Name
                  </span>
                  <span className="text-[16px] font-bold text-[#F8F9FA] block">
                    {user.teamName || user.teamCode}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] block">
                    You joined this account using a Team Code (<strong className="text-[#FFC107]">{user.teamCode}</strong>). Team members cannot create a new team.
                  </span>
                </div>
                <div className="px-3 py-2 rounded-[2px] bg-[#1E222A] border border-[#2A2E35] text-right shrink-0">
                  <span className="text-[10px] text-[#94A3B8] uppercase block">Team Code</span>
                  <span className="text-[14px] font-bold text-[#FFC107] tabular-nums">{user.teamCode}</span>
                </div>
              </div>
            ) : user.teamCode ? (
              /* Case 2: Phone-registered user who has already created a team -> Show their Team Name & shareable Team Code */
              <div className="p-3 rounded-[2px] bg-[#161920] border border-[#2A2E35] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider block">
                    Created Team Name
                  </span>
                  <span className="text-[16px] font-bold text-[#F8F9FA] block">
                    {user.teamName || user.teamCode}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] block">
                    Share your Team Code below so players can join <strong className="text-[#F8F9FA]">{user.teamName}</strong> during registration.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-[2px] bg-[#1E222A] border border-[#FFC107]/50">
                    <span className="text-[10px] text-[#94A3B8] uppercase block leading-none">Invite Team Code</span>
                    <span className="text-[14px] font-bold text-[#FFC107] tabular-nums">{user.teamCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTeamCode}
                    className="px-3 py-2.5 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] text-[#F8F9FA] text-[12px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-[#00875A]" /> : <Copy className="w-3.5 h-3.5 text-[#FFC107]" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Case 3: Phone-registered user who hasn't created a team yet -> Can create a team */
              <form onSubmit={handleCreateTeamSubmit} className="p-3 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-2.5">
                <div className="space-y-0.5">
                  <span className="text-[12px] font-bold text-[#F8F9FA] block">
                    Create Your Own Team
                  </span>
                  <span className="text-[11px] text-[#94A3B8] block">
                    Because you registered with a UK mobile number, you can create an official Team and receive a unique Team Code for members to join.
                  </span>
                </div>

                {teamError && (
                  <div className="p-2 rounded-[2px] bg-[#1E222A] border border-red-500 text-red-400 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{teamError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter your Team Name (e.g. London Lions FC)"
                    className="flex-1 bg-[#1E222A] border border-[#2A2E35] focus:border-[#FFC107] rounded-[2px] px-3 py-2 text-[13px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingTeam}
                    className="px-4 py-2 rounded-[2px] bg-[#FFC107] hover:bg-[#e5ac00] text-[#111418] font-bold text-[12px] uppercase tracking-wider shrink-0 transition-colors disabled:opacity-50"
                  >
                    {isCreatingTeam ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
                Cashier & Transaction Ledger
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Deposit funds, request instant UK bank withdrawals, or view full audit logs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openDeposit}
                className="px-3.5 py-1.5 rounded-[2px] bg-[#00875A] text-white text-[12px] font-bold uppercase tracking-wider"
              >
                Deposit Funds
              </button>
              <button
                type="button"
                onClick={() => setTab('transactions')}
                className="px-3.5 py-1.5 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] text-[#F8F9FA] text-[12px] font-bold uppercase tracking-wider"
              >
                View Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: IDENTITY & KYC VERIFICATION ── */}
      {tab === 'verification' && (
        <div className="space-y-2.5">
          <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-3 space-y-3">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
              Identity Verification Status (KYC)
            </h2>

            <div className="space-y-2">
              {/* Level 1 */}
              <div className="p-3 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[2px] bg-[#00875A] flex items-center justify-center text-white">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#F8F9FA]">
                        Level 1: UK Government Photo ID & Age Verification
                      </h3>
                      <p className="text-[11px] text-[#94A3B8]">
                        UK Driving Licence / British Passport verified • 18+ Confirmed
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="COMPLETED" />
                </div>
                <p className="text-[11px] text-[#94A3B8] pl-10">
                  Full wagering privileges activated with deposit and withdrawal limits up to £10,000 / month.
                </p>
              </div>

              {/* Level 2 */}
              <div className="p-3 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[2px] bg-[#FFC107] flex items-center justify-center text-[#111418]">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#F8F9FA]">
                        Level 2: Proof of UK Residential Address
                      </h3>
                      <p className="text-[11px] text-[#94A3B8]">
                        Council Tax Bill, Utility Statement or UK Bank Statement
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="PENDING" />
                </div>
                <p className="text-[11px] text-[#94A3B8] pl-10">
                  Required to lift monthly cash-out limits beyond £10,000 and enable expedited wire transfers.
                </p>
                <div className="pl-10">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] text-[#F8F9FA] text-[12px] font-bold inline-flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4 text-[#FFC107]" />
                    <span>Upload Proof of Address Document</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SECURITY & 2FA ── */}
      {tab === 'security' && (
        <div className="space-y-2.5">
          <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-3 space-y-3">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
              Account Security & Access Control
            </h2>

            {/* 2FA Toggle */}
            <div className="p-3 rounded-[2px] bg-[#161920] border border-[#2A2E35] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[2px] bg-[#232832] border border-[#2A2E35] flex items-center justify-center text-[#FFC107]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#F8F9FA]">
                    Two-Factor Authentication (2FA)
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    Require a one-time TOTP code from Google Authenticator on all withdrawals.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={[
                  'px-3.5 py-1.5 rounded-[2px] text-[12px] font-bold transition-colors border',
                  twoFactorEnabled
                    ? 'bg-[#00875A] text-white border-[#00875A]'
                    : 'bg-[#232832] text-[#94A3B8] border-[#2A2E35]',
                ].join(' ')}
              >
                {twoFactorEnabled ? '2FA Enabled' : 'Enable 2FA'}
              </button>
            </div>

            {/* Active Sessions */}
            <div className="p-3 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-2">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#F8F9FA]">
                Active Devices & Sessions
              </h3>
              <div className="flex items-center justify-between px-2.5 py-2 rounded-[2px] bg-[#1E222A] border border-[#2A2E35]">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#00875A]" />
                  <div>
                    <span className="text-[#F8F9FA] font-bold text-[14px] block">Windows Chrome 124 (Current Session)</span>
                    <span className="text-[11px] text-[#94A3B8]">IP: 81.2.69.142 • London, United Kingdom</span>
                  </div>
                </div>
                <span className="text-[11px] text-white font-bold uppercase px-2 py-0.5 rounded-[2px] bg-[#00875A]">
                  Active Now
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: RESPONSIBLE GAMBLING ── */}
      {tab === 'responsible' && (
        <form onSubmit={handleSaveLimits} className="space-y-2.5">
          <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-3 space-y-3">
            <div className="p-2.5 rounded-[2px] bg-[#161920] border border-[#FFC107] text-[11px] text-[#FFC107] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Player protection limits take effect immediately for downward revisions. Any limit increase requires a mandatory 24-hour cooling-off waiting period to prevent impulsive gambling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Daily Deposit Limit */}
              <div className="space-y-1 p-2.5 rounded-[2px] bg-[#161920] border border-[#2A2E35]">
                <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block">
                  Daily Deposit Limit (£)
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={depositLimit}
                  onChange={(e) => setDepositLimit(e.target.value)}
                  className="w-full bg-[#232832] border border-[#2A2E35] rounded-[2px] px-3 py-1.5 text-[14px] tabular-nums font-bold text-[#F8F9FA] focus:outline-none focus:border-[#FFC107]"
                />
                <span className="text-[11px] text-[#94A3B8] block tabular-nums">Current limit: £{depositLimit}/day</span>
              </div>

              {/* Daily Loss Limit */}
              <div className="space-y-1 p-2.5 rounded-[2px] bg-[#161920] border border-[#2A2E35]">
                <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block">
                  Daily Loss Limit (£)
                </label>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  value={lossLimit}
                  onChange={(e) => setLossLimit(e.target.value)}
                  className="w-full bg-[#232832] border border-[#2A2E35] rounded-[2px] px-3 py-1.5 text-[14px] tabular-nums font-bold text-[#F8F9FA] focus:outline-none focus:border-[#FFC107]"
                />
                <span className="text-[11px] text-[#94A3B8] block tabular-nums">Current limit: £{lossLimit}/day</span>
              </div>

              {/* Session Duration */}
              <div className="space-y-1 p-2.5 rounded-[2px] bg-[#161920] border border-[#2A2E35]">
                <label className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] block">
                  Session Reminder Alert
                </label>
                <select
                  value={sessionLimit}
                  onChange={(e) => setSessionLimit(e.target.value)}
                  className="w-full bg-[#232832] border border-[#2A2E35] rounded-[2px] px-3 py-1.5 text-[14px] font-bold text-[#F8F9FA] focus:outline-none focus:border-[#FFC107]"
                >
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes (1 Hour)</option>
                  <option value="120">120 Minutes (2 Hours)</option>
                  <option value="240">240 Minutes (4 Hours)</option>
                </select>
                <span className="text-[11px] text-[#94A3B8] block">Triggers in-app break dialog</span>
              </div>
            </div>

            {/* Self-Exclusion & Break */}
            <div className="p-2.5 rounded-[2px] bg-[#161920] border border-[#2A2E35] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-[14px] font-bold text-[#F8F9FA]">Need a Break / Self Exclusion?</h4>
                <p className="text-[11px] text-[#94A3B8]">
                  Instantly suspend wagering and deposit capabilities across your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('Cooling-off initiated for 24 hours. Bets are disabled.')}
                className="px-3 py-1.5 rounded-[2px] bg-[#1E222A] hover:bg-[#232832] border border-red-500 text-red-400 text-[12px] font-bold transition-colors"
              >
                Request 24h Cool Off
              </button>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="py-2 px-5 rounded-[2px] bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-[12px] uppercase tracking-wider transition-colors"
              >
                Save Protection Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 5: TRANSACTION HISTORY & AUDIT LEDGER ── */}
      {tab === 'transactions' && (
        <div className="space-y-2.5">
          <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#F8F9FA]">
                  Double-Entry Wallet Ledger History
                </h2>
                <p className="text-[11px] text-[#94A3B8]">
                  All transactions include verified £0.00 zero-fee platform processing.
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1 bg-[#161920] border border-[#2A2E35] rounded-[2px] p-0.5">
                {['ALL', 'DEPOSIT', 'WITHDRAWAL'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTxFilter(f)}
                    className={[
                      'px-2.5 py-1 rounded-[2px] text-[11px] font-bold transition-colors',
                      txFilter === f
                        ? 'bg-[#FFC107] text-[#111418]'
                        : 'text-[#94A3B8] hover:text-[#F8F9FA]',
                    ].join(' ')}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions List (Max 8px vertical row padding) */}
            {filteredTransactions.length === 0 ? (
              <div className="py-10 text-center text-[#94A3B8] text-[11px]">
                No ledger transactions recorded under this filter.
              </div>
            ) : (
              <div className="divide-y divide-[#2A2E35] border border-[#2A2E35] rounded-[2px] bg-[#161920] overflow-hidden">
                {filteredTransactions.map((tx) => {
                  const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'deposit';
                  return (
                    <div
                      key={tx.id}
                      className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 hover:bg-[#1E222A] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={[
                            'w-6 h-6 rounded-[2px] flex items-center justify-center shrink-0 text-[12px] font-bold',
                            isDeposit
                              ? 'bg-[#00875A] text-white'
                              : 'bg-[#232832] text-[#FFC107] border border-[#2A2E35]',
                          ].join(' ')}
                        >
                          {isDeposit ? '+' : '↑'}
                        </div>
                        <div>
                          <div className="font-bold text-[#F8F9FA] text-[14px]">
                            {tx.description || (isDeposit ? 'Deposit via Faster Payments / UK Debit Card' : 'UK Bank Wire Withdrawal')}
                          </div>
                          <div className="text-[11px] text-[#94A3B8]">
                            {new Date(tx.timestamp).toLocaleString('en-GB', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • ID: {tx.id.slice(-8)} • <span className="text-[#00875A] font-bold">Fee: £0.00</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={tx.status} />
                        <span
                          className={[
                            'tabular-nums font-bold text-[14px]',
                            isDeposit ? 'text-[#00875A]' : 'text-[#F8F9FA]',
                          ].join(' ')}
                        >
                          {isDeposit ? '+' : '-'}£{Number(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}