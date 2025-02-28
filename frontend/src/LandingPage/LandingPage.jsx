const LandingPage = () => {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white bg-gradient-to-r from-blue-900 to-blue-700 text-center">
        {/* Navbar */}
        <div className="absolute top-0 w-full p-5 bg-black bg-opacity-20 text-2xl font-bold">
          Legal Document eVault
        </div>
        
        {/* Main Content */}
        <div className="max-w-md p-8 bg-white bg-opacity-10 rounded-lg shadow-lg mt-20">
          <h1 className="text-2xl font-bold mb-2">Securely Store Your Legal Documents</h1>
          <p className="text-sm opacity-80 mb-5">
            Upload, verify, and retrieve legal documents with blockchain security.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/signup" className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg shadow-md transition-transform transform hover:bg-orange-600 hover:scale-105">
              Get Started
            </a>
            <a href="/login" className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg shadow-md transition-transform transform hover:bg-orange-600 hover:scale-105">
              Login
            </a>
          </div>
        </div>
      </div>
    );
  };
  
export default LandingPage;
  