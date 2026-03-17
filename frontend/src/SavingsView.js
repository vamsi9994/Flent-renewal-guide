import { useState } from "react";
import "@/App.css";
import { CheckCircle2, HelpCircle, Loader2, ChevronRight, Sparkles, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// FAQ Data
const FAQ_DATA = [
  {
    question: "What happens if I don't confirm my renewal in time?",
    answer: "If we don't receive confirmation before the renewal deadline, the renewal will happen at the standard escalation percentage and you will lose your savings."
  },
  {
    question: "What is escalation applied on?",
    answer: "Escalation is applied on the total rent, which includes both the base rent and the service fee."
  },
  {
    question: "Why is my rent increasing?",
    answer: "Rent is periodically revised to stay aligned with current market rates which is levied by the landlord."
  },
  {
    question: "Will my rent change again during the new lock-in?",
    answer: "No. Once your renewal is confirmed, the revised rent will remain fixed for the duration of the new lock-in period."
  },
  {
    question: "Can I switch rooms or properties during renewal?",
    answer: "You cannot switch rooms/homes during the lock-in period. Switching homes may attract forfeiture of security deposit."
  },
  {
    question: "Can I cancel my renewal after confirming it?",
    answer: "Once the renewal terms are locked-in on the system, a cancellation may attract security deposit forfeiture."
  }
];

// Savings options configuration
const SAVINGS_OPTIONS = [
  { id: 'save-0', discount: 0, lockIn: 0, label: "No Lock-in" },
  { id: 'save-30', discount: 30, lockIn: 6, label: "6 Months" },
  { id: 'save-40', discount: 40, lockIn: 9, label: "9 Months" },
  { id: 'save-50', discount: 50, lockIn: 11, label: "11 Months" },
];

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Get URL parameters
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    email: params.get('email') || '',
    name: params.get('name') || '',
    rent: params.get('rent') ? parseInt(params.get('rent')) : 50000,
    escalation: params.get('escalation') ? parseFloat(params.get('escalation')) : 10,
  };
};

function SavingsView() {
  const urlParams = getUrlParams();
  
  const [currentRent] = useState(urlParams.rent);
  const [escalation] = useState(urlParams.escalation);
  const [tenantEmail, setTenantEmail] = useState(urlParams.email);
  const [tenantName, setTenantName] = useState(urlParams.name);
  const [selectedSavings, setSelectedSavings] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');

  // Calculate escalation amount
  const escalationAmount = (currentRent * escalation) / 100;
  const newBaseRent = currentRent + escalationAmount;

  // Calculate savings for each option
  const calculateSavings = (option) => {
    const discountAmount = (escalationAmount * option.discount) / 100;
    const totalSavings = discountAmount * 11;
    const newMonthlyRent = newBaseRent - discountAmount;
    return { discountAmount, totalSavings, newMonthlyRent };
  };

  // Get selected option details
  const selectedOption = selectedSavings 
    ? SAVINGS_OPTIONS.find(opt => opt.id === selectedSavings) 
    : null;
  
  const selectedCalc = selectedOption ? calculateSavings(selectedOption) : null;

  // Handle submission
  const handleSubmit = async () => {
    if (!tenantEmail) {
      setSubmitStatus('error');
      setSubmitMessage('Please enter your email address.');
      return;
    }
    if (!selectedOption) {
      setSubmitStatus('error');
      setSubmitMessage('Please select a savings plan.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await axios.post(`${API}/renewal/submit`, {
        tenant_email: tenantEmail,
        tenant_name: tenantName || null,
        current_rent: currentRent,
        escalation_percent: escalation,
        lockin_months: selectedOption.lockIn,
        lockin_label: selectedOption.label + " Lock-in",
        discount_percent: selectedOption.discount,
        new_monthly_rent: selectedCalc.newMonthlyRent,
        total_savings: selectedCalc.totalSavings,
      });

      setSubmitStatus('success');
      setSubmitMessage(response.data.message);
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(error.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitStatus === 'success') {
    return (
      <div className="App min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <a href="https://flent.in" target="_blank" rel="noopener noreferrer">
              <span className="text-4xl font-bold text-zinc-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>flent</span>
            </a>
          </div>
          <Card className="bg-white border-zinc-200 rounded-xl shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#008E7515' }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: '#008E75' }} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                You're All Set!
              </h2>
              <p className="text-zinc-500 mb-6">{submitMessage}</p>
              <div className="bg-zinc-50 rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Your Savings</span>
                    <span className="font-bold" style={{ color: '#008E75' }}>{formatCurrency(selectedCalc.totalSavings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Lock-in Period</span>
                    <span className="text-zinc-800 font-medium">{selectedOption.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">New Monthly Rent</span>
                    <span className="text-zinc-800 font-mono">{formatCurrency(selectedCalc.newMonthlyRent)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="https://flent.in" target="_blank" rel="noopener noreferrer">
            <span className="text-4xl md:text-5xl font-bold text-zinc-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>flent</span>
          </a>
        </div>

        {/* Congratulations */}
        <div className="text-center mb-10">
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-800 mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            🎉 Congratulations on Completing Your First Term!
          </h1>
          <p className="text-zinc-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            As a valued Flent resident, you've unlocked exclusive renewal savings. 
            Choose how much you'd like to save, and we'll show you the best deal for your next term.
          </p>
        </div>

        {/* Current Rent Info */}
        <div className="flex justify-center gap-6 mb-10 text-sm">
          <div className="text-center">
            <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Current Rent</p>
            <p className="font-mono font-semibold text-zinc-800">{formatCurrency(currentRent)}</p>
          </div>
          <div className="text-center">
            <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Escalation</p>
            <p className="font-mono font-semibold text-zinc-800">{escalation}%</p>
          </div>
          <div className="text-center">
            <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">New Base Rent</p>
            <p className="font-mono font-semibold text-zinc-800">{formatCurrency(newBaseRent)}</p>
          </div>
        </div>

        {/* Email/Name Input */}
        <div className="max-w-md mx-auto mb-10">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-widest mb-1.5 block">Email *</label>
                <Input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 h-10 text-sm"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-widest mb-1.5 block">Name</label>
                <Input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 h-10 text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="text-center mb-6">
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-medium">
            How much would you like to save?
          </p>
        </div>

        {/* Savings Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {SAVINGS_OPTIONS.map((option) => {
            const { totalSavings } = calculateSavings(option);
            const isSelected = selectedSavings === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => setSelectedSavings(option.id)}
                className={`relative p-4 md:p-5 rounded-xl border-2 transition-all text-center ${
                  isSelected 
                    ? 'border-2 shadow-lg transform scale-[1.02]' 
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
                style={isSelected ? { 
                  borderColor: '#008E75', 
                  background: '#008E7508',
                  boxShadow: '0 8px 24px rgba(0, 142, 117, 0.15)'
                } : {}}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#008E75' }}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <p className="text-2xl md:text-3xl font-bold mb-1" style={{ 
                  color: isSelected ? '#008E75' : '#18181b',
                  fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}>
                  {formatCurrency(totalSavings)}
                </p>
                <p className="text-xs text-zinc-500">
                  {option.discount > 0 ? `${option.discount}% off` : 'No discount'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Deal Summary */}
        {selectedOption && (
          <div className="max-w-lg mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="border-2 rounded-xl overflow-hidden" style={{ borderColor: '#008E75' }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#008E75' }}>
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">Your Deal for Next Term</span>
              </div>
              <CardContent className="p-5 bg-white">
                <div className="space-y-4">
                  {/* Monthly Escalated Base Rent */}
                  <div className="flex justify-between items-center py-2 border-b border-zinc-200">
                    <div>
                      <p className="text-zinc-800 font-medium text-sm">Monthly Escalated Base Rent</p>
                      <p className="text-zinc-500 text-xs">Current rent + {escalation}% escalation</p>
                    </div>
                    <p className="font-mono text-zinc-800 font-semibold">{formatCurrency(newBaseRent)}</p>
                  </div>

                  {/* Discount on Escalation */}
                  <div className="flex justify-between items-center py-2 border-b border-zinc-200">
                    <div>
                      <p className="text-zinc-800 font-medium text-sm">Discount on Escalation</p>
                      <p className="text-zinc-500 text-xs">{selectedOption.discount}% off on {formatCurrency(escalationAmount)}</p>
                    </div>
                    <p className="font-mono font-semibold" style={{ color: selectedOption.discount > 0 ? '#008E75' : '#a1a1aa' }}>
                      {selectedOption.discount > 0 ? `-${formatCurrency(selectedCalc.discountAmount)}` : '₹0'}
                    </p>
                  </div>

                  {/* Lock-in Contract Term */}
                  <div className="flex justify-between items-center py-2 border-b border-zinc-200">
                    <div>
                      <p className="text-zinc-800 font-medium text-sm">Lock-in Contract Term</p>
                      <p className="text-zinc-500 text-xs">Minimum commitment period</p>
                    </div>
                    <p className="font-semibold px-3 py-1 rounded-full text-sm" style={{ background: '#FFE988', color: '#7a6800' }}>
                      {selectedOption.lockIn > 0 ? `${selectedOption.lockIn} Months` : 'Flexible'}
                    </p>
                  </div>

                  {/* New Monthly Rent */}
                  <div className="flex justify-between items-center py-3 rounded-lg px-3 bg-zinc-100">
                    <div>
                      <p className="text-zinc-800 font-semibold text-sm">Your New Monthly Rent</p>
                    </div>
                    <p className="font-mono text-xl font-bold text-zinc-900">{formatCurrency(selectedCalc.newMonthlyRent)}</p>
                  </div>

                  {/* Term Savings */}
                  <div className="flex justify-between items-center py-3 rounded-lg px-3" style={{ background: '#008E7515' }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#008E75' }}>Total Term Savings (11 months)</p>
                    </div>
                    <p className="font-mono text-xl font-bold" style={{ color: '#008E75' }}>{formatCurrency(selectedCalc.totalSavings)}</p>
                  </div>
                </div>

                {/* Error Message */}
                {submitStatus === 'error' && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-red-600 text-sm">{submitMessage}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !tenantEmail}
                  className="w-full h-12 mt-5 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: '#008E75' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      Confirm My Choice
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Placeholder when no selection */}
        {!selectedOption && (
          <div className="max-w-lg mx-auto mb-8 text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
            <p className="text-zinc-400">Select a savings amount above to see your deal</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-zinc-400 text-xs leading-relaxed">
            * These exclusive discounts are extended by Flent only for the upcoming renewal term. 
            After this term ends, standard escalation and base rent will apply for subsequent renewals.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-zinc-200 rounded-lg">
              <HelpCircle className="w-4 h-4 text-zinc-500" />
            </div>
            <h2 className="text-base font-semibold text-zinc-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Frequently Asked Questions
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_DATA.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white border border-zinc-200 rounded-lg px-4 data-[state=open]:border-zinc-300 shadow-sm"
              >
                <AccordionTrigger className="text-left text-zinc-700 hover:no-underline py-4 text-sm font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-500 pb-4 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="h-8"></div>
      </div>
    </div>
  );
}

export default SavingsView;
