import { Search, Shield, Leaf } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Thorough Research",
      description: "We thoroughly research each product so you don't have to read the fine print."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Verified Ingredients",
      description: "We verify all ingredients to ensure they meet our health and safety standards."
    },
    {
      icon: <Leaf className="h-8 w-8" />,
      title: "Eco-Friendly Options",
      description: "We prioritize products that are environmentally sustainable and ethically produced."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">Why Choose Clean Bee</h2>
          <p className="mt-4 max-w-2xl text-xl text-neutral-600 mx-auto">
            We make it easy to find products that align with your values and health goals.
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600">
                {benefit.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold text-neutral-900">{benefit.title}</h3>
              <p className="mt-2 text-base text-neutral-600 text-center">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
