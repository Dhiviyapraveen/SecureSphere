import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Home Page - Landing page
 */

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6 text-6xl">
          🔒
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          SecureSphere
        </h1>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          A privacy-preserving data sharing system with end-to-end encryption,
          secure file storage, and controlled access management
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <Link
            to="/register"
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            Login
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {/* Feature 1 */}
          <div className="bg-slate-800 rounded-lg p-8">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-white mb-2">AES-256 Encryption</h3>
            <p className="text-slate-400">
              Military-grade encryption ensures your files are always protected
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-800 rounded-lg p-8">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold text-white mb-2">Secure Sharing</h3>
            <p className="text-slate-400">
              Share files with fine-grained access control and role-based permissions
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-800 rounded-lg p-8">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-white mb-2">File Integrity</h3>
            <p className="text-slate-400">
              SHA-256 hashing verifies that your files haven't been tampered with
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-800 rounded-lg p-8">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-bold text-white mb-2">JWT Authentication</h3>
            <p className="text-slate-400">
              Secure token-based authentication with bcrypt password hashing
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-slate-800 rounded-lg p-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Dashboard</h3>
            <p className="text-slate-400">
              Manage all your files and shared content from one intuitive interface
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-slate-800 rounded-lg p-8">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-white mb-2">Privacy First</h3>
            <p className="text-slate-400">
              Your data remains your data with complete privacy and security controls
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 bg-slate-800 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-white mb-8">Built With</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⚛️</div>
              <p className="text-white font-semibold">React.js</p>
              <p className="text-slate-400">Frontend</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <p className="text-white font-semibold">Express.js</p>
              <p className="text-slate-400">Backend</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-white font-semibold">MongoDB</p>
              <p className="text-slate-400">Database</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎨</div>
              <p className="text-white font-semibold">TailwindCSS</p>
              <p className="text-slate-400">Styling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
