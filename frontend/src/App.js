import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { Lock, Unlock, TrendingUp, Calculator, CheckCircle2, HelpCircle, Send, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
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

// Lock-in options configuration
const LOCKIN_OPTIONS = [
  { months: 0, label: "No lock-in", discount: 0 },
  { months: 6, label: "6 months", discount: 30 },
  { months: 9, label: "9 months", discount: 40 },
  { months: 11, label: "11 months", discount: 50 },
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
    rent: params.get('rent') ? parseInt(params.get('rent')) : null,
    escalation: params.get('escalation') ? parseFloat(params.get('escalation')) : null,
  };
};

// Animated number component
const AnimatedNumber = ({ value, className, prefix = "", suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const duration = 300;
    const startValue = displayValue;
    const diff = value - startValue;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={className}>
      {prefix}{formatCurrency(displayValue)}{suffix}
    </span>
  );
};

function App() {
  const urlParams = getUrlParams();
  
  const [currentRent, setCurrentRent] = useState(urlParams.rent || 50000);
  const [escalation, setEscalation] = useState(urlParams.escalation || 10);
  const [sliderValue, setSliderValue] = useState([0]);
  const [tenantEmail, setTenantEmail] = useState(urlParams.email);
  const [tenantName, setTenantName] = useState(urlParams.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [submitMessage, setSubmitMessage] = useState('');

  // Get current lock-in option based on slider
  const currentOption = LOCKIN_OPTIONS[sliderValue[0]];

  // Calculate escalation amount (monthly increase)
  const escalationAmount = (currentRent * escalation) / 100;

  // Calculate discount on escalation
  const discountAmount = (escalationAmount * currentOption.discount) / 100;

  // New rent after applying discounted escalation
  const newMonthlyRent = currentRent + escalationAmount - discountAmount;

  // Calculate total savings over 11 months
  const totalSavings = discountAmount * 11;

  // Handle rent input change
  const handleRentChange = useCallback((e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCurrentRent(value ? parseInt(value) : 0);
  }, []);

  // Handle escalation input change
  const handleEscalationChange = useCallback((e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setEscalation(numValue);
    } else if (value === '') {
      setEscalation(0);
    }
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!tenantEmail) {
      setSubmitStatus('error');
      setSubmitMessage('Please enter your email address to submit.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage('');

    try {
      const response = await axios.post(`${API}/renewal/submit`, {
        tenant_email: tenantEmail,
        tenant_name: tenantName || null,
        current_rent: currentRent,
        escalation_percent: escalation,
        lockin_months: currentOption.months,
        lockin_label: currentOption.label,
        discount_percent: currentOption.discount,
        new_monthly_rent: newMonthlyRent,
        total_savings: totalSavings,
      });

      setSubmitStatus('success');
      setSubmitMessage(response.data.message);
    } catch (error) {
      setSubmitStatus('error');
      let errorMessage = 'Something went wrong. Please try again or contact support.';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors (422)
          errorMessage = error.response.data.detail
            .map(err => err.msg || 'Validation error')
            .join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          // Handle string error messages (500, etc.)
          errorMessage = error.response.data.detail;
        }
      }
      
      setSubmitMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="App min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      {/* Background overlay */}
      <div className="bg-overlay" />

      {/* Content */}
      <div className="content-wrapper">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Renewal Guide
            </h1>
            <p className="text-zinc-600 text-base md:text-lg max-w-2xl mx-auto mb-6">
              Choose your lock-in period and see how much you can save on your renewal
            </p>
            
            {/* Program Introduction */}
            <div className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 text-left shadow-sm">
              <p className="text-zinc-700 text-base leading-relaxed mb-3">
                We've designed this program as a small thank you for choosing to stay with us longer. 
                The longer you commit, the more you save — it's our way of rewarding your trust and making your stay even more rewarding.
              </p>
              <p className="text-zinc-500 text-sm">
                Simply pick a lock-in period that works for you, and watch the savings add up.
              </p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Panel - Control Panel */}
            <div className="lg:col-span-5">
              <Card className="bg-white border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-zinc-100 rounded-lg">
                      <Calculator className="w-5 h-5 text-zinc-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-zinc-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Your Details
                    </h2>
                  </div>

                  {/* Current Rent Input */}
                  <div className="mb-6">
                    <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">
                      Current Monthly Rent
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">₹</span>
                      <Input
                        data-testid="rent-input"
                        type="text"
                        value={currentRent.toLocaleString('en-IN')}
                        onChange={handleRentChange}
                        className="bg-zinc-50 border-zinc-200 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 text-zinc-900 font-mono text-lg h-14 pl-10"
                        placeholder="50,000"
                      />
                    </div>
                  </div>

                  {/* Standard Escalation Input */}
                  <div className="mb-8">
                    <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">
                      Standard Escalation
                    </label>
                    <div className="relative">
                      <Input
                        data-testid="escalation-input"
                        type="text"
                        value={escalation}
                        onChange={handleEscalationChange}
                        className="bg-zinc-50 border-zinc-200 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 text-zinc-900 font-mono text-lg h-14 pr-10"
                        placeholder="10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">%</span>
                    </div>
                    <p className="text-zinc-500 text-sm mt-2">
                      Monthly escalation: <span className="font-mono text-zinc-700">{formatCurrency(escalationAmount)}</span>
                    </p>
                  </div>

                  {/* Lock-in Slider */}
                  <div>
                    <label className="text-zinc-500 text-xs uppercase tracking-widest mb-4 block">
                      Choose Lock-in Period
                    </label>
                    <div className="custom-slider light-slider px-1" data-testid="lockin-slider">
                      <Slider
                        value={sliderValue}
                        onValueChange={setSliderValue}
                        max={3}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    {/* Slider Markers */}
                    <div className="slider-markers mt-4">
                      {LOCKIN_OPTIONS.map((option, index) => (
                        <span
                          key={option.months}
                          className={`slider-marker text-xs cursor-pointer ${sliderValue[0] === index ? 'active' : ''}`}
                          onClick={() => setSliderValue([index])}
                        >
                          {option.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-7">
              <Card className="bg-white border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-6 md:p-8">
                  {/* Selected Plan Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${currentOption.months > 0 ? 'bg-green-500/10' : 'bg-zinc-100'}`}>
                        {currentOption.months > 0 ? (
                          <Lock className="w-5 h-5 text-green-600" />
                        ) : (
                          <Unlock className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-zinc-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          {currentOption.label}
                        </h2>
                        <p className="text-zinc-500 text-sm">
                          {currentOption.discount > 0 
                            ? `${currentOption.discount}% off escalation`
                            : 'Standard escalation applies'
                          }
                        </p>
                      </div>
                    </div>
                    {currentOption.discount > 0 && (
                      <div className="bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">
                        Save {currentOption.discount}%
                      </div>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-3 border-b border-zinc-200">
                      <span className="text-zinc-600">Current Rent</span>
                      <span className="font-mono text-zinc-900" data-testid="current-rent-display">
                        {formatCurrency(currentRent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-200">
                      <span className="text-zinc-600">Escalation ({escalation}%)</span>
                      <span className="font-mono text-zinc-900">
                        +{formatCurrency(escalationAmount)}
                      </span>
                    </div>
                    {currentOption.discount > 0 && (
                      <div className="flex justify-between items-center py-3 border-b border-zinc-200">
                        <span className="text-zinc-600">Discount on Escalation</span>
                        <span className="font-mono text-green-600">
                          -{formatCurrency(discountAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* New Monthly Rent */}
                  <div className="bg-zinc-100 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">New Monthly Rent</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-500 text-sm">Starting next term</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <AnimatedNumber
                          value={newMonthlyRent}
                          className="font-mono text-3xl md:text-4xl font-bold text-zinc-900 number-transition"
                          data-testid="monthly-rent-display"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Savings - Hero Element */}
                  <div className={`rounded-xl p-6 ${totalSavings > 0 ? 'bg-green-50 border border-green-200' : 'bg-zinc-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-6 h-6 ${totalSavings > 0 ? 'text-green-600' : 'text-zinc-400'}`} />
                        <div>
                          <p className={`text-sm uppercase tracking-wider mb-1 ${totalSavings > 0 ? 'text-green-700' : 'text-zinc-500'}`}>
                            Total Savings (11 months)
                          </p>
                          <p className="text-zinc-500 text-xs">
                            Compared to no lock-in option
                          </p>
                        </div>
                      </div>
                      <div data-testid="total-savings-display">
                        <AnimatedNumber
                          value={totalSavings}
                          className={`font-mono text-4xl md:text-5xl font-bold number-transition ${totalSavings > 0 ? 'text-green-600' : 'text-zinc-400'}`}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Section */}
          <div className="mt-12 max-w-3xl mx-auto">
            <Card className="bg-white border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Send className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Confirm Your Choice
                  </h2>
                </div>

                {submitStatus !== 'success' ? (
                  <>
                    <p className="text-zinc-600 text-sm mb-6">
                      Ready to lock in your savings? Enter your email below and we'll send you a confirmation along with notifying our team.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">
                          Your Email *
                        </label>
                        <Input
                          data-testid="tenant-email-input"
                          type="email"
                          value={tenantEmail}
                          onChange={(e) => setTenantEmail(e.target.value)}
                          className="bg-zinc-50 border-zinc-200 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 text-zinc-900 h-12"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-xs uppercase tracking-widest mb-2 block">
                          Your Name (Optional)
                        </label>
                        <Input
                          data-testid="tenant-name-input"
                          type="text"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          className="bg-zinc-50 border-zinc-200 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 text-zinc-900 h-12"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    {/* Summary before submit */}
                    <div className="bg-zinc-100 rounded-xl p-4 mb-6">
                      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Your Selection Summary</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500">Lock-in: </span>
                          <span className="text-zinc-900 font-medium">{currentOption.label}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">New Rent: </span>
                          <span className="text-zinc-900 font-mono">{formatCurrency(newMonthlyRent)}</span>
                        </div>
                        {totalSavings > 0 && (
                          <div>
                            <span className="text-zinc-500">Savings: </span>
                            <span className="text-green-600 font-mono">{formatCurrency(totalSavings)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {submitStatus === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-600 text-sm">{submitMessage}</p>
                      </div>
                    )}

                    <Button
                      data-testid="submit-btn"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !tenantEmail}
                      className="w-full h-14 bg-green-600 hover:bg-green-500 text-white font-semibold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Submit My Choice
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 mb-2">Submission Successful!</h3>
                    <p className="text-zinc-600 text-sm max-w-md mx-auto">
                      {submitMessage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-12 text-zinc-500 text-sm">
            <p>Savings calculated over the standard 11-month term period</p>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 md:mt-20 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-zinc-200 rounded-lg">
                <HelpCircle className="w-5 h-5 text-zinc-600" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Frequently Asked Questions
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ_DATA.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white border border-zinc-200 rounded-xl px-6 data-[state=open]:border-zinc-300 shadow-sm"
                >
                  <AccordionTrigger className="text-left text-zinc-900 hover:no-underline py-5 text-base font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-600 pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Bottom spacing */}
          <div className="h-12"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
