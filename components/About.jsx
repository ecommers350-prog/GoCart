"use client";

import Image from "next/image";

const AboutPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <h1 className="text-4xl font-bold text-center mb-6">About Us</h1>
      <p className="text-center text-lg text-slate-700 mb-12">
        Welcome to <span className="font-semibold">GoCart</span>, your one-stop destination for a seamless online shopping experience!
      </p>

      {/* Founder Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Kamalesh */}
        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 relative rounded-full overflow-hidden mb-4 bg-slate-100">
            <Image
              src="/images/kamalesh.jpg"
              alt="Kamalesh"
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold">Kamalesh</h3>
          <p className="text-slate-600 mt-2">
            Brings a keen eye for business strategy and operations, ensuring that GoCart runs efficiently and effectively for all our customers.
          </p>
        </div>

        {/* Jeeva */}
        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 relative rounded-full overflow-hidden mb-4 bg-slate-100">
            <Image
              src="/images/jeeva.jpg"
              alt="Jeeva"
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold">Jeeva</h3>
          <p className="text-slate-600 mt-2">
            Our tech and innovation expert, constantly optimizing our platform to make your online shopping fast, secure, and hassle-free.
          </p>
        </div>

        {/* Vicky */}
        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 relative rounded-full overflow-hidden mb-4 bg-slate-100">
            <Image
              src="/images/vicky.jpg"
              alt="Vicky"
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold">Vicky</h3>
          <p className="text-slate-600 mt-2">
            Leads our customer experience initiatives, ensuring every interaction with GoCart is friendly, supportive, and personalized.
          </p>
        </div>
      </div>

      {/* Mission & Promise */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Our Mission</h2>
        <p className="text-slate-700">
          Our mission is simple: to bring the best products right to your doorstep while making your shopping journey smooth, enjoyable, and reliable.
        </p>

        <h2 className="text-2xl font-bold">Our Promise</h2>
        <ul className="text-slate-700 list-disc list-inside space-y-2">
          <li>Delivering high-quality products at competitive prices.</li>
          <li>Offering a secure and easy-to-use shopping experience.</li>
          <li>Providing responsive customer support whenever you need it.</li>
        </ul>

        <p className="text-slate-700 mt-4">
          Whether you’re shopping for essentials or discovering something new, GoCart is here to make your online shopping experience effortless and enjoyable.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
