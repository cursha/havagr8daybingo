import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { WalletData, Transaction, getWallet, addFunds, getTransactions } from '@/lib/game-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Heart, Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const FUND_OPTIONS = [5, 10, 20];

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addingFunds, setAddingFunds] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { state: { from: '/wallet' } });
    }
  }, [loading, user, navigate]);

  const loadWalletData = async () => {
    try {
      const [walletData, txnData] = await Promise.all([getWallet(), getTransactions()]);
      setWallet(walletData);
      setTransactions(txnData.transactions || []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load wallet');
    }
  };

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const handleAddFunds = async (amount: number) => {
    setAddingFunds(true);
    try {
      const result = await addFunds(amount);
      setWallet((prev) => (prev ? { ...prev, balance: result.new_balance } : null));
      toast.success(`$${amount} added to your wallet`);
      await loadWalletData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add funds');
    } finally {
      setAddingFunds(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/game')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Heart className="w-6 h-6 text-indigo-600 fill-indigo-600" />
          <span className="text-lg font-bold text-slate-800">My Wallet</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0 shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 rounded-full p-2">
                <WalletIcon className="w-6 h-6" />
              </div>
              <span className="text-indigo-200 font-medium">Current Balance</span>
            </div>
            <div className="text-4xl sm:text-5xl font-bold mb-1">
              ${wallet?.balance?.toFixed(2) || '0.00'}
            </div>
            <p className="text-indigo-200 text-sm">Use your balance to purchase power-up squares on your Gr8Day card</p>
          </CardContent>
        </Card>

        {/* Add Funds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              Add Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Select an amount to top up your wallet. Funds can be used to purchase select squares on your card.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FUND_OPTIONS.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => handleAddFunds(amount)}
                  disabled={addingFunds}
                  className="h-16 text-lg font-bold border-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-1.5 ${
                          txn.transaction_type === 'deposit'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {txn.transaction_type === 'deposit' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {txn.item_description || txn.transaction_type}
                        </p>
                        <p className="text-xs text-slate-400">
                          {txn.created_at
                            ? new Date(txn.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        txn.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;