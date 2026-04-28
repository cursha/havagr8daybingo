import React, { useEffect, useState } from 'react';
import {
  ProfileStatus,
  getRegistrationStatus,
  registerProfile,
} from '@/lib/game-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Gift, Loader2 } from 'lucide-react';

interface RegistrationModalProps {
  /** When true, the modal cannot be dismissed until completed. */
  enforce?: boolean;
  /** Called after a successful completion (or when already completed). */
  onCompleted?: (status: ProfileStatus) => void;
}

/**
 * Shows a one-time registration form after login to collect first name,
 * last name, and email. The backend grants a wallet bonus (amount is admin-
 * configurable via game_configs, default $15) on the first successful
 * completion.
 */
const RegistrationModal: React.FC<RegistrationModalProps> = ({ enforce = true, onCompleted }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bonusAmount, setBonusAmount] = useState<number>(15);

  useEffect(() => {
    let cancelled = false;
    const checkStatus = async () => {
      try {
        const status = await getRegistrationStatus();
        if (cancelled) return;
        if (typeof status?.signup_bonus_amount === 'number') {
          setBonusAmount(status.signup_bonus_amount);
        }
        if (status?.profile_completed) {
          setOpen(false);
          onCompleted?.(status);
        } else {
          setEmail(status?.email ?? '');
          setFirstName(status?.first_name ?? '');
          setLastName(status?.last_name ?? '');
          setOpen(true);
        }
      } catch {
        // Unauthenticated or network error — silently skip.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [onCompleted]);

  const bonusLabel = `$${bonusAmount.toFixed(bonusAmount % 1 === 0 ? 0 : 2)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();
    const mail = email.trim();
    if (!fn || !ln || !mail) {
      toast.error('Please fill in all fields.');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(mail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await registerProfile({ first_name: fn, last_name: ln, email: mail });
      if (data?.bonus_granted) {
        toast.success(`🎉 Welcome! ${bonusLabel} has been credited to your wallet.`);
      } else {
        toast.success('Profile saved.');
      }
      setOpen(false);
      onCompleted?.({
        profile_completed: true,
        signup_bonus_granted: !!data?.bonus_granted,
        first_name: data?.first_name,
        last_name: data?.last_name,
        email: data?.email,
        signup_bonus_amount: bonusAmount,
      });
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (enforce && !next) return; // cannot be dismissed when enforced
        setOpen(next);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (enforce) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (enforce) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-md">
            <Gift className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">Complete Your Registration</DialogTitle>
          <DialogDescription className="text-center">
            {bonusAmount > 0 ? (
              <>
                Tell us a little about you and we'll credit{' '}
                <span className="font-semibold text-emerald-600">{bonusLabel}</span> to your wallet as a
                welcome gift.
              </>
            ) : (
              <>Tell us a little about you to finish setting up your account.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                autoComplete="given-name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Johnson"
                autoComplete="family-name"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-emerald-500 text-white hover:opacity-95"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : bonusAmount > 0 ? (
              `Claim my ${bonusLabel} welcome bonus`
            ) : (
              'Complete Registration'
            )}
          </Button>
          <p className="text-center text-xs text-slate-500">
            Your info is only used for your Gr8Day Bingo account.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationModal;