"use client";
import React, { useState } from 'react';
import { Mail, Trash2, Shield, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const DataDeletionPage = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // In a real app, this would send the deletion request
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/prod-logo.png"
              alt="IconicMe Logo" 
              className="w-10 h-10 rounded-xl object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IconicMe</h1>
              <p className="text-sm text-gray-600">Image Style Editor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Main Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trash2 className="w-12 h-12 text-red-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Data Deletion Request</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Request deletion of your personal data from <strong>IconicMe</strong> by our development team
          </p>
        </div>

        {!submitted ? (
          <>
            {/* Steps Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                Steps to Request Data Deletion
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">1</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Fill out the form below</h3>
                    <p className="text-gray-600">Provide your email address and specify what data you'd like deleted from IconicMe.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">2</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">We verify your identity</h3>
                    <p className="text-gray-600">Our team will verify that you're the owner of the account associated with the provided email address.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">3</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Data deletion confirmation</h3>
                    <p className="text-gray-600">You'll receive an email confirmation once your data has been successfully deleted from our systems.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Mail className="w-6 h-6 text-blue-500 mr-3" />
                Submit Deletion Request
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the email associated with your IconicMe account"
                  />
                  <p className="text-sm text-gray-500 mt-1">This must match the email used in your IconicMe account or payment information</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us why you're requesting data deletion (optional)"
                  />
                </div>
                
                <button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
                >
                  Submit Deletion Request
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted Successfully</h2>
            <p className="text-gray-600 mb-4">
              We've received your data deletion request for <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              You'll receive a confirmation email within 2-3 business days once your data has been deleted.
            </p>
          </div>
        )}

        {/* Data Types Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="w-6 h-6 text-green-500 mr-3" />
            Types of Data We Delete or Retain
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                Data We DELETE
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Account Information:</strong> Email, username, profile settings</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Image Processing History:</strong> Records of images you've styled with IconicMe</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>App Usage Data:</strong> Feature usage, preferences, settings</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Device Information:</strong> Device ID, app version, system info</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Data We RETAIN
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Payment Records:</strong> Transaction history via Lemon Squeezy (for legal/tax compliance)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Anonymous Analytics:</strong> Aggregated usage statistics (cannot identify you)</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Legal Records:</strong> Data required by law to be retained</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Retention Period */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="w-6 h-6 text-orange-500 mr-3" />
            Data Retention Periods
          </h2>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Personal Data Deletion</h3>
              <p className="text-blue-800">Your personal data will be permanently deleted within <strong>30 days</strong> of request verification.</p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">Payment Information</h3>
              <p className="text-orange-800">Financial transaction data is retained by Lemon Squeezy for <strong>7 years</strong> as required by tax and financial regulations.</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Image Processing</h3>
              <p className="text-green-800">Your uploaded images are <strong>never stored</strong> on our servers. They are processed via Black Forest Labs Flux API and immediately discarded.</p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
            <div className='none'>
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">Important Information</h3>
              <ul className="space-y-2 text-yellow-800">
                <li>• Data deletion is <strong>permanent and cannot be undone</strong></li>
                <li>• Processing time is typically 2-3 business days after identity verification</li>
                <li>• You'll need to create a new account if you want to use IconicMe again</li>
                <li>• Some data may be retained for legal compliance as outlined above</li>
                <li>• Contact us at <strong>consult@iconicme.shop</strong> if you have questions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            This page is linked from the <strong>IconicMe</strong> app listing on Google Play Store
          </p>
          {/* <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default DataDeletionPage;