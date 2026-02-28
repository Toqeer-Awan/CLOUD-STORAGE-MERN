import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdCheckCircle, MdStorage, MdCloud, MdSecurity,
  MdSpeed, MdPeople, MdClose, MdStar
} from 'react-icons/md';
import useQuota from '../hooks/useQuota';
import { formatBytes } from '../config/quotaConfig';

const UpgradePlan = () => {
  const navigate = useNavigate();
  const quota = useQuota();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      storage: 5 * 1024 * 1024 * 1024,
      files: 100,
      fileSize: 100 * 1024 * 1024,
      dailyUpload: 1 * 1024 * 1024 * 1024,
      features: [
        { name: '5GB Storage', included: true },
        { name: '100 Files', included: true },
        { name: '100MB per file', included: true },
        { name: '1GB Daily Upload', included: true },
        { name: 'Basic Support', included: true },
        { name: 'Advanced Analytics', included: false },
        { name: 'Priority Support', included: false },
        { name: 'Custom Branding', included: false }
      ],
      color: 'gray',
      recommended: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99',
      period: 'per month',
      storage: 50 * 1024 * 1024 * 1024,
      files: 1000,
      fileSize: 500 * 1024 * 1024,
      dailyUpload: 10 * 1024 * 1024 * 1024,
      features: [
        { name: '50GB Storage', included: true },
        { name: '1,000 Files', included: true },
        { name: '500MB per file', included: true },
        { name: '10GB Daily Upload', included: true },
        { name: 'Advanced Analytics', included: true },
        { name: 'Priority Support', included: true },
        { name: 'Custom Branding', included: true },
        { name: 'Team Collaboration', included: true }
      ],
      color: 'orange',
      recommended: true
    },
    {
      id: 'business',
      name: 'Business',
      price: '$29.99',
      period: 'per month',
      storage: 200 * 1024 * 1024 * 1024,
      files: 5000,
      fileSize: 1 * 1024 * 1024 * 1024, // 1GB
      dailyUpload: 50 * 1024 * 1024 * 1024,
      features: [
        { name: '200GB Storage', included: true },
        { name: '5,000 Files', included: true },
        { name: '1GB per file', included: true },
        { name: '50GB Daily Upload', included: true },
        { name: 'Advanced Analytics', included: true },
        { name: '24/7 Priority Support', included: true },
        { name: 'Custom Branding', included: true },
        { name: 'Team Collaboration', included: true },
        { name: 'API Access', included: true },
        { name: 'SLA Guarantee', included: true }
      ],
      color: 'purple',
      recommended: false
    }
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Successfully upgraded to ${selectedPlan} plan!`);
      navigate('/');
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = quota.plan || 'free';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade Your Storage Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose the perfect plan for your needs. All plans include our core features.
          </p>
        </div>

        {/* Current Usage Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Your Current Usage
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatBytes(quota.used)} / {formatBytes(quota.total)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Files</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {quota.fileCount} / {quota.maxFiles}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Daily Upload</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatBytes(quota.daily.used)} / {formatBytes(quota.daily.limit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400 capitalize">
                {currentPlan}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all transform hover:-translate-y-1 ${
                  isSelected ? 'ring-4 ring-orange-500 scale-105' : ''
                } ${isCurrentPlan ? 'opacity-75' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
                    Recommended
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 text-sm font-medium rounded-br-lg">
                    Current Plan
                  </div>
                )}

                <div className="p-8">
                  <h3 className={`text-2xl font-bold text-${plan.color}-600 dark:text-${plan.color}-400 mb-2`}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      {plan.period}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MdStorage className="mr-2 text-blue-500" />
                      <span>{formatBytes(plan.storage)} Storage</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MdCloud className="mr-2 text-green-500" />
                      <span>Up to {plan.files} files</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MdSpeed className="mr-2 text-purple-500" />
                      <span>{formatBytes(plan.fileSize)} per file</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MdPeople className="mr-2 text-orange-500" />
                      <span>{formatBytes(plan.dailyUpload)} daily upload</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {feature.included ? (
                          <MdCheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        ) : (
                          <MdClose className="text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrentPlan && (
                    <button
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        isSelected
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </button>
                  )}

                  {isCurrentPlan && (
                    <div className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-center font-medium">
                      Current Plan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade Button */}
        {selectedPlan !== currentPlan && (
          <div className="mt-8 text-center">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Upgrade to ${plans.find(p => p.id === selectedPlan)?.name} Plan`
              )}
            </button>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              30-day money-back guarantee • Cancel anytime
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradePlan;