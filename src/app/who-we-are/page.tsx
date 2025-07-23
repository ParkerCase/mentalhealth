export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Who We Are</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 style={{color: "#374151"}} className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-gray-700 mb-4">
          Men&apos;s mental health is at an all time low. Our mission at AriseDivineMasculine is to connect individuals with the support groups and communities they need to 
          thrive. We believe that everyone deserves access to supportive spaces where they can share 
          experiences, find resources, and build meaningful connections.
        </p>
        <p className="text-gray-700">
          Through our platform, we aim to break down barriers to accessing support and make it easier 
          for people to find communities that understand their unique circumstances and challenges.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 style={{color: "#374151"}} className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4">
          AriseDivineMasculine was founded in 2025 out of a personal experience with the challenges of 
            finding appropriate support groups. Our founder, Jon Fisher recognized that while many support resources 
            exist, they often remain difficult to discover for those who need them most.
          </p>
          <p className="text-gray-700">
            What began as a simple directory has grown into a comprehensive platform that not only helps 
            people find support groups but also empowers these groups to connect with those who can 
            benefit from their services.
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 style={{color: "#374151"}} className="text-2xl font-semibold mb-4">Our Values</h2>
          <ul className="space-y-3">
            <li style={{color: "#374151"}} className="flex">
              <div  className="mr-2 mt-1 text-blue-600 rounded-full p-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <strong style={{color: "#374151"}} className="font-medium">Accessibility</strong>: Making support resources available to all, regardless of background or circumstance.
              </div>
            </li>
            <li style={{color: "#374151"}} className="flex">
              <div className="mr-2 mt-1  text-blue-600 rounded-full p-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <strong className="font-medium">Community</strong>: Fostering connections that help people feel understood and supported.
              </div>
            </li>
            <li style={{color: "#374151"}} className="flex">
              <div className="mr-2 mt-1 text-blue-600 rounded-full p-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <strong className="font-medium">Empowerment</strong>: Providing tools and resources that help individuals and groups thrive.
              </div>
            </li>
            <li style={{color: "#374151"}} className="flex">
              <div className="mr-2 mt-1 text-blue-600 rounded-full p-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <strong className="font-medium">Trust</strong>: Maintaining privacy, security, and integrity in all our operations.
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 style={{color: "#374151"}} className="text-2xl font-semibold mb-4">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className=" bg-gray-200 "></div>
            <h3 className="text-lg font-semibold"></h3>
            <p className="text-gray-600"></p>
          </div>
          <div  className="text-center">
            <div className="w-32 h-32 mx-auto rounded-full mb-4 overflow-hidden bg-gray-200 flex items-center justify-center">
              <img
                src="/assets/arise-fish.jpeg"
                alt="Jon Fisher, Founder & CEO"
                className="object-cover w-full h-full"
                style={{ display: 'block' }}
              />
            </div>
            <h3 className="text-gray-700 font-semibold">Jon Fisher</h3>
            <p className="text-gray-600">Founder & CEO</p>
          </div>
          <div className="text-center">
            <div className=" bg-gray-200 "></div>
            <h3 className="text-lg font-semibold"></h3>
            <p className="text-gray-600"></p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
        <h2 style={{color: "#374151"}} className="text-2xl font-semibold mb-4">Join Our Mission</h2>
        <p className="text-gray-700 mb-4">
          We&apos;re always looking for passionate individuals and organizations to join our mission. Whether 
          you want to register your support group, volunteer your time, or partner with us, we&apos;d love to 
          hear from you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/groups/register"
            className="bg-orange-600 text-white px-6 py-3 rounded-md text-center hover:bg-orange-700 transition-colors"
          >
            Register Your Group
          </a>
          <a
            href="/contact"
            className="bg-white text-orange-600 border border-orange-600 px-6 py-3 rounded-md text-center hover:bg-blue-50 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}