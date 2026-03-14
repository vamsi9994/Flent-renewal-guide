import { useState, useCallback } from "react";
import "@/App.css";
import { Check, Loader2, CheckCircle2, HelpCircle } from "lucide-react";
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
    question: "How is rent calculated if my renewal starts mid-month?",
    answer: "If your renewal begins mid-month, the rent for the remaining days will be prorated based on the renewal date and added to the following month's rent invoice."
  },
  {
    question: "Are these discounts and benefits lifetime offers?",
    answer: "No. The discounts and benefits offered are exclusive to this renewal term. Once the term ends, the rent will revert to the base rent along with the standard escalation applicable at that time."
  },
  {
    question: "Will my rent increase after the lock-in period ends?",
    answer: "No. The pricing is fixed for the full agreement term (11 months). The lock-in period only defines your minimum stay commitment — the rent remains the same throughout the entire term."
  },
  {
    question: "Can I increase my lock-in period later and still get the same discounts?",
    answer: "Lock-in choices made during renewal are fixed for the duration of that term. You may be able to extend the lock-in after the initial lock-in period ends, depending on program availability. Any discounts offered at that time will be subject to Flent's discretion."
  }
];

// Plan options
const PLANS = [
  { 
    id: 'plan-0',
    months: 0, 
    discount: 0, 
    label: "No Lock-in",
    popular: false
  },
  { 
    id: 'plan-6',
    months: 6, 
    discount: 30, 
    label: "6 Months Lock-in",
    popular: false
  },
  { 
    id: 'plan-9',
    months: 9, 
    discount: 40, 
    label: "9 Months Lock-in",
    popular: true
  },
  { 
    id: 'plan-11',
    months: 11, 
    discount: 50, 
    label: "11 Months Lock-in",
    popular: false
  },
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

function SubscriptionView() {
  const urlParams = getUrlParams();
  
  const [currentRent] = useState(urlParams.rent);
  const [escalation] = useState(urlParams.escalation);
  const [tenantEmail, setTenantEmail] = useState(urlParams.email);
  const [tenantName, setTenantName] = useState(urlParams.name);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');

  // Calculate escalation amount
  const escalationAmount = (currentRent * escalation) / 100;

  // Calculate for a specific plan
  const calculateForPlan = (plan) => {
    const discountAmount = (escalationAmount * plan.discount) / 100;
    const newMonthlyRent = currentRent + escalationAmount - discountAmount;
    const totalSavings = discountAmount * 11;
    return { discountAmount, newMonthlyRent, totalSavings };
  };

  // Handle plan selection and submission
  const handleSelectPlan = async (plan) => {
    if (!tenantEmail) {
      setSubmitStatus('error');
      setSubmitMessage('Please enter your email address first.');
      return;
    }

    setSelectedPlan(plan.id);
    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage('');

    const { discountAmount, newMonthlyRent, totalSavings } = calculateForPlan(plan);

    try {
      const response = await axios.post(`${API}/renewal/submit`, {
        tenant_email: tenantEmail,
        tenant_name: tenantName || null,
        current_rent: currentRent,
        escalation_percent: escalation,
        lockin_months: plan.months,
        lockin_label: plan.label,
        discount_percent: plan.discount,
        new_monthly_rent: newMonthlyRent,
        total_savings: totalSavings,
      });

      setSubmitStatus('success');
      setSubmitMessage(response.data.message);
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(
        error.response?.data?.detail || 
        'Something went wrong. Please try again or contact support.'
      );
      setSelectedPlan(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    const plan = PLANS.find(p => p.id === selectedPlan);
    const { newMonthlyRent, totalSavings } = calculateForPlan(plan);
    
    return (
      <div className="App min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-20">
          {/* Flent Brand Logo */}
          <div className="text-center mb-8">
            <a href="https://flent.in" target="_blank" rel="noopener noreferrer" className="inline-block">
              <span className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                flent
              </span>
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
              
              <div className="bg-zinc-50 rounded-lg p-4 text-left mb-4">
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Your Selected Plan</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Lock-in Period</span>
                    <span className="text-zinc-900 font-medium">{plan.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Discount</span>
                    <span className="font-medium" style={{ color: '#008E75' }}>{plan.discount}% off escalation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">New Monthly Rent</span>
                    <span className="text-zinc-900 font-mono font-medium">{formatCurrency(newMonthlyRent)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200">
                    <span className="text-zinc-500">Total Savings (11 months)</span>
                    <span className="font-mono font-bold" style={{ color: '#008E75' }}>{formatCurrency(totalSavings)}</span>
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
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {/* Flent Brand Logo */}
        <div className="text-center mb-6">
          <a href="https://flent.in" target="_blank" rel="noopener noreferrer" className="inline-block">
            <span className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              flent
            </span>
          </a>
        </div>

        {/* Congratulations Header */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-800 mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            🎉 Congratulations on Completing Your First Term!
          </h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed mb-3">
              As a token of appreciation for being a valued Flent resident, we're excited to offer you exclusive renewal discounts. 
              The longer you commit, the more you save — choose a plan below and lock in your savings for the next term.
            </p>
            <p className="text-zinc-400 text-xs">
              Your current rent: <span className="font-mono font-medium text-zinc-600">{formatCurrency(currentRent)}</span> • 
              Standard escalation: <span className="font-mono font-medium text-zinc-600">{escalation}%</span>
            </p>
          </div>
        </div>

        {/* Email Input Section */}
        <div className="max-w-md mx-auto mb-10">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-widest mb-1.5 block">Email *</label>
                <Input
                  data-testid="tenant-email-input"
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
                  data-testid="tenant-name-input"
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 h-10 text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>
            {submitStatus === 'error' && (
              <p className="text-red-500 text-xs mt-2">{submitMessage}</p>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {PLANS.map((plan) => {
            const { discountAmount, newMonthlyRent, totalSavings } = calculateForPlan(plan);
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden rounded-xl transition-all ${
                  plan.popular 
                    ? 'border-2 shadow-lg' 
                    : 'border border-zinc-200 shadow-sm'
                } ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
                style={{ 
                  borderColor: plan.popular ? '#008E75' : undefined,
                  background: plan.popular ? '#008E7508' : 'white',
                  ringColor: isSelected ? '#008E75' : undefined
                }}
              >
                {plan.popular && (
                  <div 
                    className="absolute top-0 left-0 right-0 text-center text-xs font-semibold py-1 text-white"
                    style={{ background: '#008E75' }}
                  >
                    MOST POPULAR
                  </div>
                )}
                
                <CardContent className={`p-6 ${plan.popular ? 'pt-10' : ''}`}>
                  {/* Discount Badge */}
                  <div className="text-center mb-4">
                    <span 
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: '#FFE988', color: '#7a6800' }}
                    >
                      {plan.label}
                    </span>
                  </div>

                  {/* Discount Percentage */}
                  <div className="text-center mb-2">
                    <span 
                      className="text-5xl md:text-6xl font-bold"
                      style={{ color: '#008E75', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {plan.discount}%
                    </span>
                    <span className="text-zinc-400 text-lg ml-1">off</span>
                  </div>
                  <p className="text-center text-zinc-500 text-sm mb-6">on escalation</p>

                  {/* Pricing Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">You Save</span>
                      <span className="font-mono font-medium" style={{ color: '#008E75' }}>
                        {formatCurrency(discountAmount)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">New Rent</span>
                      <span className="font-mono font-medium text-zinc-800">
                        {formatCurrency(newMonthlyRent)}/mo
                      </span>
                    </div>
                    <div 
                      className="flex justify-between text-sm pt-3 border-t"
                      style={{ borderColor: plan.popular ? '#008E7530' : '#e4e4e7' }}
                    >
                      <span className="text-zinc-500">Total Savings</span>
                      <span className="font-mono font-bold" style={{ color: '#008E75' }}>
                        {formatCurrency(totalSavings)}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Check className="w-4 h-4" style={{ color: '#008E75' }} />
                      <span>Fixed rent for 11 months</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Check className="w-4 h-4" style={{ color: '#008E75' }} />
                      <span>No hidden charges</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Check className="w-4 h-4" style={{ color: '#008E75' }} />
                      <span>Priority support</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    data-testid={`select-plan-${plan.months}`}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isSubmitting}
                    className={`w-full h-11 font-semibold text-sm rounded-lg transition-all ${
                      plan.popular ? 'text-white' : 'text-zinc-800'
                    }`}
                    style={{ 
                      background: plan.popular ? '#008E75' : '#f4f4f5',
                      boxShadow: plan.popular ? '0 4px 12px rgba(0, 142, 117, 0.3)' : 'none'
                    }}
                  >
                    {isSubmitting && isSelected ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Select This Plan'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-zinc-400 text-xs leading-relaxed">
            * These exclusive discounts are extended by Flent only for the upcoming renewal term. 
            After this term ends, the standard escalation and base rent will apply for subsequent renewals.
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

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}

export default SubscriptionView;
