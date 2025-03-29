import { Search, Shield, Leaf, CheckCircle, Droplets, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Benefits = () => {
  const benefits = [
    {
      icon: <Search className="h-8 w-8" />,
      color: "bg-amber-100 text-amber-600",
      title: "Thorough Research",
      description: "We thoroughly research each product so you don't have to read the fine print."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      color: "bg-primary-100 text-primary-600",
      title: "Verified Ingredients",
      description: "We verify all ingredients to ensure they meet our health and safety standards."
    },
    {
      icon: <Leaf className="h-8 w-8" />,
      color: "bg-green-100 text-green-600",
      title: "Eco-Friendly Options",
      description: "We prioritize products that are environmentally sustainable and ethically produced."
    }
  ];
  
  const additionalBenefits = [
    { icon: <CheckCircle className="h-5 w-5 mr-2" />, text: "Free from harmful chemicals" },
    { icon: <Droplets className="h-5 w-5 mr-2" />, text: "Non-toxic alternatives" },
    { icon: <ThumbsUp className="h-5 w-5 mr-2" />, text: "Transparent labeling" }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-50 rounded-full opacity-70"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-50 rounded-full opacity-60"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full text-primary-700 bg-primary-50 text-sm font-medium mb-3">
            Our Promise
          </span>
          <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">Why Choose Clean Bee</h2>
          <p className="mt-4 max-w-2xl text-xl text-neutral-600 mx-auto">
            We make it easy to find products that align with your values and health goals.
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className={cn("flex items-center justify-center h-16 w-16 rounded-full", benefit.color)}>
                {benefit.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold text-neutral-900">{benefit.title}</h3>
              <p className="mt-3 text-base text-neutral-600 text-center">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-neutral-50 rounded-2xl p-8 md:p-10">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold text-neutral-900">
                Our Products Are Always:
              </h3>
              <div className="mt-6 space-y-4">
                {additionalBenefits.map((item, index) => (
                  <div key={index} className="flex items-center text-neutral-700">
                    <div className="flex-shrink-0 text-primary-600">
                      {item.icon}
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 md:mt-0 md:w-1/2">
              <div className="relative bg-white rounded-lg p-6 shadow-sm border border-neutral-100">
                <blockquote className="italic text-neutral-700">
                  "Clean Bee has transformed how I shop for home products. I can trust that everything they recommend is safe for my family and the environment."
                </blockquote>
                <div className="mt-4 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-800">JD</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">Jane Doe</p>
                    <p className="text-sm text-neutral-500">Happy Customer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
