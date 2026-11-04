import React, { useState, useMemo, useEffect } from 'react';
import { useBetting } from '../context/BettingContext';
import MaterialIcon from '../components/MaterialIcon';

const PAYMENT_METHODS = [
  {
    id: 'debit_card',
    label: 'Card',
    sub: 'Visa / Mastercard',
    icon: 'credit_card',
    channel: 'card',
    minDeposit: 5,
    minWithdraw: 10,
  },
  {
    id: 'faster_payments',
    label: 'Bank',
    sub: 'UK Faster Payments',
    icon: 'account_balance',
    channel: 'bank',
    minDeposit: 5,
    minWithdraw: 10,
  },
];

/**
 * Super-Simple, Modern Materialistic Deposit & Withdraw Page (RolalBet UK)
 * - Collects Card details (Cardholder Name, Card Number, Expiry, CVV) or Bank details (Bank Name, Sort Code, Account Number) first.
 * - Initializes the Martha Solutions Payment Gateway session invisibly in the background (never showing any URL to the user).
 * - Checks payment verification status and only credits the wallet when payment is confirmed.
 */
export default function WalletPage({ onBack }) {
  const {
    user,
    balance,
    activeBets,
    transactions,
    walletModalTab,
    setWalletModalTab,
    createGatewaySession,
    submitGatewayPin,
    submitGatewayOtp,
    verifyGatewayPayment,
    cancelGatewayPayment,
    withdraw,
    setCurrentView,
  } = useBetting();

  const activeTab = walletModalTab === 'withdraw' ? 'withdraw' : 'deposit';

  const [methodId, setMethodId] = useState('debit_card');
  const [amount, setAmount] = useState('50');

  // Card Details State (collected before processing)
  const [cardName, setCardName] = useState(user?.fullName || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Bank Details State (collected before processing)
  const [bankName, setBankName] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Invisible Martha Solutions Gateway session
  const [gatewaySession, setGatewaySession] = useState(null);
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  const selectedMethod =
    PAYMENT_METHODS.find((m) => m.id === methodId) || PAYMENT_METHODS[0];

  const inPlayBalance = useMemo(() => {
    return (activeBets || []).reduce((sum, b) => sum + Number(b.stake || 0), 0);
  }, [activeBets]);

  const numericAmount = parseFloat(amount) || 0;

  const recentTransactions = useMemo(() => {
    return (transactions || []).slice(0, 6);
  }, [transactions]);

  // Format Card Number as XXXX XXXX XXXX XXXX
  const handleCardNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    setFeedback(null);
  };

  // Format Expiry as MM/YY
  const handleExpiryChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
    setFeedback(null);
  };

  // Format Sort Code as XX-XX-XX
  const handleSortCodeChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    if (digits.length > 4) {
      setSortCode(`${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`);
    } else if (digits.length > 2) {
      setSortCode(`${digits.slice(0, 2)}-${digits.slice(2)}`);
    } else {
      setSortCode(digits);
    }
    setFeedback(null);
  };

  // Background auto-polling while an invisible Martha Gateway session is active
  useEffect(() => {
    if (!gatewaySession?.reference) return;

    const timer = setInterval(async () => {
      const res = await verifyGatewayPayment(gatewaySession.reference, true);
      if (res && res.paid) {
        clearInterval(timer);
        setGatewaySession(null);
        setFeedback({
          type: 'success',
          text:
            res.message ||
            `£${Number(res.amount || numericAmount).toFixed(2)} verified and added to your wallet.`,
        });
      } else if (res && res.terminal) {
        clearInterval(timer);
        setGatewaySession(null);
        setFeedback({
          type: 'error',
          text:
            res.message ||
            'Payment failed or was declined. Your wallet was not credited.',
        });
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [gatewaySession, verifyGatewayPayment, numericAmount]);

  const handleCancelDeposit = async () => {
    const ref = gatewaySession?.reference;
    setGatewaySession(null);
    if (ref && cancelGatewayPayment) {
      await cancelGatewayPayment(ref);
    }
    setFeedback({
      type: 'error',
      text: 'Deposit cancelled by user. Your account was not charged.',
    });
  };

  const switchTab = (tab) => {
    setWalletModalTab(tab);
    setFeedback(null);
    setGatewaySession(null);
  };

  const validatePaymentDetails = () => {
    if (methodId === 'debit_card') {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (!cardName.trim()) {
        return 'Please enter the Cardholder Name.';
      }
      if (cleanCard.length < 12) {
        return 'Please enter a valid 16-digit Card Number.';
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        return 'Please enter a valid Expiry Date (MM/YY).';
      }
      if (cardCvv.replace(/\D/g, '').length < 3) {
        return 'Please enter a valid 3-digit CVV security code.';
      }
    } else {
      if (!bankName.trim()) {
        return 'Please enter your UK Bank Name.';
      }
      if (sortCode.replace(/\D/g, '').length < 6) {
        return 'Please enter a valid 6-digit UK Sort Code (e.g. 20-45-19).';
      }
      if (accountNumber.replace(/\D/g, '').length < 8) {
        return 'Please enter a valid 8-digit UK Account Number.';
      }
    }
    return null;
  };

  const handleManualVerify = async () => {
    if (!gatewaySession?.reference) return;
    setIsVerifying(true);
    setFeedback(null);
    const res = await verifyGatewayPayment(gatewaySession.reference, false);
    setIsVerifying(false);

    if (res && res.paid) {
      setGatewaySession(null);
      setFeedback({
        type: 'success',
        text:
          res.message ||
          `£${Number(res.amount || gatewaySession.amount).toFixed(2)} payment verified and credited to your wallet!`,
      });
    } else if (res && res.terminal) {
      setGatewaySession(null);
      setFeedback({
        type: 'error',
        text:
          res.message ||
          'Payment failed or was cancelled. Your wallet was not credited.',
      });
    } else {
      setFeedback({
        type: 'error',
        text:
          res?.message ||
          'Payment has not been confirmed yet. Please complete authorization to proceed.',
      });
    }
  };

  const handleSubmitAuthCode = async () => {
    if (!gatewaySession?.reference || !authCodeInput.trim()) return;
    setIsSubmittingCode(true);
    try {
      const isPin = gatewaySession.chargeStatus === 'send_pin';
      const res = isPin
        ? await submitGatewayPin(gatewaySession.reference, authCodeInput.trim())
        : await submitGatewayOtp(gatewaySession.reference, authCodeInput.trim());

      setAuthCodeInput('');
      if (res && res.terminal) {
        setGatewaySession(null);
        setFeedback({
          type: 'error',
          text: res.message || 'Authorization failed or was declined. Wallet was not charged.',
        });
        return;
      }

      if (res && res.status) {
        setGatewaySession((prev) =>
          prev
            ? {
                ...prev,
                chargeStatus: res.status,
                displayText: res.message || prev.displayText,
                authUrl: res.authUrl || prev.authUrl,
              }
            : null
        );
      }

      const check = await verifyGatewayPayment(gatewaySession.reference, true);
      if (check && check.paid) {
        setGatewaySession(null);
        setFeedback({
          type: 'success',
          text:
            check.message ||
            `£${Number(gatewaySession.amount).toFixed(2)} verified and added to your wallet!`,
        });
      } else if (check && check.terminal) {
        setGatewaySession(null);
        setFeedback({
          type: 'error',
          text: check.message || 'Payment failed or was declined.',
        });
      }
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const detailError = validatePaymentDetails();
    if (detailError) {
      setFeedback({
        type: 'error',
        text: detailError,
      });
      return;
    }

    if (activeTab === 'deposit') {
      if (numericAmount < selectedMethod.minDeposit) {
        setFeedback({
          type: 'error',
          text: `Minimum deposit is £${selectedMethod.minDeposit.toFixed(2)}.`,
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const session = await createGatewaySession({
          amount: numericAmount,
          methodId: selectedMethod.id,
          methodLabel: selectedMethod.label,
          card:
            selectedMethod.id === 'debit_card'
              ? {
                  name: cardName.trim(),
                  number: cardNumber.replace(/\s+/g, ''),
                  expiry: cardExpiry.trim(),
                  cvv: cardCvv.trim(),
                }
              : undefined,
          bank:
            selectedMethod.id === 'faster_payments'
              ? {
                  bankName: bankName.trim(),
                  sortCode: sortCode.trim(),
                  accountNumber: accountNumber.trim(),
                }
              : undefined,
        });

        if (session && session.success) {
          setAuthCodeInput('');
          setGatewaySession(session);
          // Immediately check verification status and wait for confirmation
          const check = await verifyGatewayPayment(session.reference, true);
          if (check && check.paid) {
            setGatewaySession(null);
            setFeedback({
              type: 'success',
              text:
                check.message ||
                `£${Number(session.amount).toFixed(2)} deposited via ${selectedMethod.label}.`,
            });
          } else if (check && check.terminal) {
            setGatewaySession(null);
            setFeedback({
              type: 'error',
              text:
                check.message ||
                'Payment failed or was declined. Your wallet was not credited.',
            });
          } else {
            setFeedback({
              type: 'info',
              text:
                session.displayText ||
                `Awaiting payment confirmation for £${Number(session.amount).toFixed(2)} (${selectedMethod.label})...`,
            });
          }
        } else {
          setGatewaySession(null);
          setFeedback({
            type: 'error',
            text: session?.error || 'Payment failed or could not be processed.',
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (numericAmount < selectedMethod.minWithdraw) {
        setFeedback({
          type: 'error',
          text: `Minimum withdrawal is £${selectedMethod.minWithdraw.toFixed(2)}.`,
        });
        return;
      }
      if (numericAmount > balance) {
        setFeedback({
          type: 'error',
          text: `Insufficient available balance (£${Number(balance || 0).toFixed(2)}).`,
        });
        return;
      }

      const payoutSummary =
        methodId === 'debit_card'
          ? `Card ending ${cardNumber.replace(/\s+/g, '').slice(-4)}`
          : `${bankName.trim()} (${sortCode} • ${accountNumber})`;

      setIsSubmitting(true);
      try {
        const res = await withdraw(numericAmount, payoutSummary);
        if (res && res.success) {
          setFeedback({
            type: 'success',
            text: `£${numericAmount.toFixed(2)} withdrawal sent to ${payoutSummary}.`,
          });
        } else {
          setFeedback({
            type: 'error',
            text: res?.error || 'Withdrawal could not be completed.',
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-6 px-2">
        <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[4px] p-5 text-center space-y-4">
          <div className="w-11 h-11 rounded-full bg-[#161920] border border-[#2A2E35] flex items-center justify-center mx-auto">
            <MaterialIcon name="account_balance_wallet" size={22} className="text-[#FFC107]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-[15px] font-bold text-[#F8F9FA]">Sign In Required</h2>
            <p className="text-[12px] text-[#94A3B8]">
              Sign in or create an account to deposit and withdraw funds.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3.5 py-2 rounded-[4px] bg-[#161920] border border-[#2A2E35] text-[12px] font-bold text-[#94A3B8] hover:text-[#F8F9FA] transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setCurrentView('account')}
              className="px-4 py-2 rounded-[4px] bg-[#FFC107] hover:bg-[#ffca2c] text-[#111418] text-[12px] font-bold uppercase tracking-wider transition-colors"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-2 space-y-3">
      {/* Completely Invisible Martha Solutions Gateway Frame (No URL ever shown to user) */}
      {gatewaySession?.checkoutUrl && (
        <iframe
          src={gatewaySession.checkoutUrl}
          title="Payment Gateway Background Frame"
          className="w-0 h-0 opacity-0 pointer-events-none absolute border-0 overflow-hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-[4px] bg-[#1E222A] border border-[#2A2E35] flex items-center justify-center text-[#94A3B8] hover:text-[#F8F9FA] transition-colors"
              title="Back to Sportsbook"
            >
              <MaterialIcon name="arrow_back" size={16} />
            </button>
          )}
          <h1 className="text-[15px] font-bold text-[#F8F9FA] tracking-tight">Wallet</h1>
        </div>
        <span className="text-[11px] text-[#94A3B8] flex items-center gap-1">
          <MaterialIcon name="verified_user" size={14} className="text-[#00875A]" />
          <span>Secure UK Cashier</span>
        </span>
      </div>

      {/* Material Balance Card + Segmented Tabs */}
      <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[4px] overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-[#2A2E35]">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8] block">
              Available Balance
            </span>
            <span className="text-2xl font-black tabular-nums text-[#F8F9FA]">
              £{Number(balance || 0).toFixed(2)}
            </span>
          </div>

          {inPlayBalance > 0 && (
            <div className="text-right">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8] block">
                In-Play Stakes
              </span>
              <span className="text-[14px] font-bold tabular-nums text-[#FFC107]">
                £{inPlayBalance.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Material Segmented Tab Bar */}
        <div className="grid grid-cols-2 bg-[#161920]">
          <button
            type="button"
            onClick={() => switchTab('deposit')}
            className={[
              'py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-wider border-b-2 transition-colors',
              activeTab === 'deposit'
                ? 'border-[#00875A] text-[#F8F9FA] bg-[#1E222A]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8F9FA]',
            ].join(' ')}
          >
            <MaterialIcon
              name="add_circle"
              size={15}
              className={activeTab === 'deposit' ? 'text-[#00875A]' : 'text-[#94A3B8]'}
            />
            <span>Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('withdraw')}
            className={[
              'py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-wider border-b-2 transition-colors',
              activeTab === 'withdraw'
                ? 'border-[#FFC107] text-[#F8F9FA] bg-[#1E222A]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8F9FA]',
            ].join(' ')}
          >
            <MaterialIcon
              name="arrow_circle_up"
              size={15}
              className={activeTab === 'withdraw' ? 'text-[#FFC107]' : 'text-[#94A3B8]'}
            />
            <span>Withdraw</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 1. Method Selector (Card vs Bank) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const isSelected = m.id === methodId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMethodId(m.id);
                      setGatewaySession(null);
                      setFeedback(null);
                    }}
                    className={[
                      'p-2.5 rounded-[4px] border text-left transition-colors flex items-center gap-2.5',
                      isSelected
                        ? activeTab === 'deposit'
                          ? 'bg-[#00875A]/10 border-[#00875A] text-[#F8F9FA]'
                          : 'bg-[#FFC107]/10 border-[#FFC107] text-[#F8F9FA]'
                        : 'bg-[#161920] border-[#2A2E35] text-[#94A3B8] hover:text-[#F8F9FA]',
                    ].join(' ')}
                  >
                    <MaterialIcon
                      name={m.icon}
                      size={18}
                      className={
                        isSelected
                          ? activeTab === 'deposit'
                            ? 'text-[#00875A]'
                            : 'text-[#FFC107]'
                          : 'text-[#94A3B8]'
                      }
                    />
                    <div className="min-w-0">
                      <span className="text-[12px] font-bold text-[#F8F9FA] block leading-tight">
                        {m.label}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] block truncate">{m.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Card or Bank Details Input (Collected Before Processing) */}
          {methodId === 'debit_card' ? (
            <div className="space-y-2.5 p-3 rounded-[4px] bg-[#161920] border border-[#2A2E35]">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => {
                    setCardName(e.target.value);
                    setFeedback(null);
                  }}
                  placeholder="Name on Card"
                  className="w-full bg-[#1E222A] border border-[#2A2E35] focus:border-[#FFC107] rounded-[3px] px-3 py-2 text-[13px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4532 •••• •••• ••••"
                  className="w-full bg-[#1E222A] border border-[#2A2E35] focus:border-[#FFC107] rounded-[3px] px-3 py-2 text-[13px] font-mono tabular-nums text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full bg-[#1E222A] border border-[#2A2E35] focus:border-[#FFC107] rounded-[3px] px-3 py-2 text-[13px] font-mono tabular-nums text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => {
                      setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setFeedback(null);
                    }}
                    placeholder="•••"
                    className="w-full bg-[#1E222A] border border-[#2A2E35] focus:border-[#FFC107] rounded-[3px] px-3 py-2 text-[13px] font-mono tabular-nums text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 p-3 rounded-[4px] bg-[#161920] border border-[#2A2E35]">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                  UK Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    setFeedback(null);
                  }}
                  placeholder="e.g. Barclays, HSBC, Monzo, Lloyds"
                  className="w-full bg-[#1E222A] border border-[#2A2E35] focus:border-[#FFC107] rounded-[3px] px-3 py-2 text-[13px] text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                    Sort Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sortCode}
                    onChange={handleSortCodeChange}
                    placeholder="20-45-19"
                    className="w-full bg-[#1E222A] border border-[#2A2E35] focus:border-[#FFC107] rounded-[3px] px-3 py-2 text-[13px] font-mono tabular-nums text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 8));
                      setFeedback(null);
                    }}
                    placeholder="64829104"
                    className="w-full bg-[#1E222A] border border-[#2A2E35] focus:border-[#FFC107] rounded-[3px] px-3 py-2 text-[13px] font-mono tabular-nums text-[#F8F9FA] placeholder:text-[#64748B] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-bold uppercase tracking-wider text-[#94A3B8]">
                Amount (GBP)
              </label>
              <span className="text-[#94A3B8] tabular-nums">
                Min £{(activeTab === 'deposit' ? selectedMethod.minDeposit : selectedMethod.minWithdraw).toFixed(2)} • 0% Fee
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3 text-[15px] font-bold text-[#94A3B8]">£</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setGatewaySession(null);
                  setFeedback(null);
                }}
                placeholder="0.00"
                className="w-full bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[4px] pl-7 pr-3 py-2.5 text-[16px] font-bold tabular-nums text-[#F8F9FA] focus:outline-none"
              />
            </div>

            {/* Quick Chips */}
            <div className="grid grid-cols-4 gap-1.5">
              {[10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(String(preset));
                    setGatewaySession(null);
                    setFeedback(null);
                  }}
                  className={[
                    'py-1.5 rounded-[4px] border text-[12px] font-bold tabular-nums transition-colors',
                    Number(amount) === preset
                      ? 'bg-[#252B37] border-[#FFC107] text-[#FFC107]'
                      : 'bg-[#161920] border-[#2A2E35] text-[#94A3B8] hover:text-[#F8F9FA]',
                  ].join(' ')}
                >
                  £{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={[
                'px-3 py-2 rounded-[4px] border flex items-center gap-2 text-[12px] font-medium',
                feedback.type === 'success'
                  ? 'bg-[#00875A]/15 border-[#00875A] text-[#00E676]'
                  : feedback.type === 'info'
                    ? 'bg-[#161920] border-[#FFC107]/50 text-[#FFC107]'
                    : 'bg-red-500/10 border-red-500/40 text-red-300',
              ].join(' ')}
            >
              <MaterialIcon
                name={
                  feedback.type === 'success'
                    ? 'check_circle'
                    : feedback.type === 'info'
                      ? 'hourglass_top'
                      : 'error_outline'
                }
                size={15}
              />
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Ongoing Payment Processing Indicator + Action Buttons */}
          {activeTab === 'deposit' && gatewaySession ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-[4px] bg-[#161920] border border-[#FFC107]/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-4 h-4 rounded-full border-2 border-[#FFC107] border-t-transparent animate-spin shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold text-[#F8F9FA] block">
                      Processing £{Number(gatewaySession.amount).toFixed(2)} via {gatewaySession.methodLabel}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] block truncate">
                      {gatewaySession.displayText || `Verifying payment status • Ref: ${gatewaySession.reference}`}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-[2px] bg-[#FFC107]/15 text-[#FFC107] text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Ongoing
                </span>
              </div>

              {(gatewaySession.chargeStatus === 'send_pin' ||
                gatewaySession.chargeStatus === 'send_otp') && (
                <div className="flex items-center gap-2">
                  <input
                    type={gatewaySession.chargeStatus === 'send_pin' ? 'password' : 'text'}
                    value={authCodeInput}
                    onChange={(e) => setAuthCodeInput(e.target.value)}
                    placeholder={
                      gatewaySession.chargeStatus === 'send_pin'
                        ? 'Enter 4-digit Card PIN'
                        : 'Enter OTP code sent to phone'
                    }
                    className="flex-1 bg-[#161920] border border-[#2A2E35] focus:border-[#FFC107] rounded-[4px] px-3 py-2 text-[12px] font-semibold text-[#F8F9FA] outline-none"
                  />
                  <button
                    type="button"
                    disabled={isSubmittingCode || !authCodeInput.trim()}
                    onClick={handleSubmitAuthCode}
                    className="px-3.5 py-2 rounded-[4px] bg-[#FFC107] hover:bg-[#ffca2c] text-[#111418] text-[12px] font-bold uppercase disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingCode
                      ? 'Sending...'
                      : gatewaySession.chargeStatus === 'send_pin'
                        ? 'Submit PIN'
                        : 'Submit OTP'}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleManualVerify}
                  className="flex-1 py-2.5 rounded-[4px] bg-[#00875A] hover:bg-[#009e69] text-white text-[13px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <MaterialIcon name="verified" size={15} />
                  <span>
                    {isVerifying
                      ? 'Checking Payment...'
                      : `Confirm Payment (£${Number(gatewaySession.amount).toFixed(2)})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelDeposit}
                  className="px-3.5 py-2.5 rounded-[4px] bg-[#161920] hover:bg-[#E53935]/15 border border-[#2A2E35] hover:border-[#E53935]/40 text-[#94A3B8] hover:text-[#FF5252] text-[12px] font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0}
              className={[
                'w-full py-2.5 rounded-[4px] text-[13px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer',
                activeTab === 'deposit'
                  ? 'bg-[#00875A] hover:bg-[#009e69] text-white'
                  : 'bg-[#FFC107] hover:bg-[#ffca2c] text-[#111418]',
              ].join(' ')}
            >
              <MaterialIcon
                name={activeTab === 'deposit' ? 'south_west' : 'north_east'}
                size={15}
              />
              <span>
                {isSubmitting
                  ? 'Processing...'
                  : activeTab === 'deposit'
                    ? `Deposit £${numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'}`
                    : `Withdraw £${numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'}`}
              </span>
            </button>
          )}
        </form>
      </div>

      {/* Simple Recent Activity List */}
      <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[4px] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#2A2E35] flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
            Recent Activity
          </span>
          <span className="text-[11px] text-[#94A3B8] tabular-nums">
            {recentTransactions.length} entries
          </span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-4 text-center text-[12px] text-[#94A3B8]">
            No recent transactions yet.
          </div>
        ) : (
          <div className="divide-y divide-[#2A2E35]">
            {recentTransactions.map((tx, idx) => {
              const type = String(tx.type || '').toUpperCase();
              const isCredit =
                type === 'DEPOSIT' ||
                type === 'BET_WIN' ||
                type === 'WIN' ||
                type === 'CASHOUT' ||
                Number(tx.amount) > 0;
              const absAmount = Math.abs(Number(tx.amount || 0));

              return (
                <div
                  key={tx.id || idx}
                  className="px-4 py-2 flex items-center justify-between text-[12px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MaterialIcon
                      name={isCredit ? 'south_west' : 'north_east'}
                      size={15}
                      className={isCredit ? 'text-[#00875A]' : 'text-[#94A3B8]'}
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-[#F8F9FA] block truncate">
                        {tx.description || type}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] tabular-nums">
                        {tx.timestamp
                          ? new Date(tx.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={[
                      'font-bold tabular-nums shrink-0',
                      isCredit ? 'text-[#00E676]' : 'text-[#F8F9FA]',
                    ].join(' ')}
                  >
                    {isCredit ? '+' : '-'}£{absAmount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
