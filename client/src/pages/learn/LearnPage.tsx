import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Leaf, ShieldCheck, Search, Lightbulb } from "lucide-react";

interface Guide {
  id: string;
  title: string;
  description: string;
  content: JSX.Element;
}

interface FAQ {
  question: string;
  answer: string;
}

const LearnPage = () => {
  const [activeTab, setActiveTab] = useState("guides");

  const guides: Guide[] = [
    {
      id: "reading-labels",
      title: "How to Read Product Labels",
      description: "Understanding what's really in your products",
      content: (
        <>
          <p className="mb-6 text-neutral-700">
            Reading product labels is essential for making informed decisions about the products you bring into your home. Here's what to look for:
          </p>
          <div className="bg-primary-50/30 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4 text-primary-700">Key Elements to Check</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="border border-primary-200 rounded-md p-4 bg-white/80">
                <h4 className="font-medium text-primary-800 mb-2">Ingredients List</h4>
                <ul className="list-disc pl-5 space-y-2 text-neutral-700">
                  <li>Ingredients are listed in descending order by weight</li>
                  <li>Watch out for chemical names that are difficult to pronounce</li>
                  <li>Be aware of "fragrance" or "parfum" which can contain hundreds of undisclosed chemicals</li>
                </ul>
              </div>
              <div className="border border-primary-200 rounded-md p-4 bg-white/80">
                <h4 className="font-medium text-primary-800 mb-2">Certifications to Look For</h4>
                <ul className="list-disc pl-5 space-y-2 text-neutral-700">
                  <li><strong>USDA Organic:</strong> Contains at least 95% organic ingredients</li>
                  <li><strong>EWG Verified:</strong> Free from EWG's chemicals of concern</li>
                  <li><strong>Leaping Bunny:</strong> Cruelty-free and not tested on animals</li>
                  <li><strong>Non-GMO Project:</strong> Products made without genetically modified ingredients</li>
                </ul>
              </div>
              <div className="border border-primary-200 rounded-md p-4 bg-white/80">
                <h4 className="font-medium text-primary-800 mb-2">Marketing Claims vs. Reality</h4>
                <p className="mb-2 text-neutral-700">Be cautious of these unregulated terms:</p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                  <li><strong>"Natural"</strong> - Has no regulated definition</li>
                  <li><strong>"Eco-friendly"</strong> - May refer to only one aspect</li>
                  <li><strong>"Pure"</strong> - Doesn't mean free from synthetic ingredients</li>
                  <li><strong>"Gentle"</strong> - Subjective and not regulated</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      id: "harmful-ingredients",
      title: "Ingredients to Avoid",
      description: "Common harmful ingredients in everyday products",
      content: (
        <>
          <p className="mb-6 text-neutral-700">
            These are some potentially harmful ingredients commonly found in household and personal care products:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50/50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3 text-red-700">In Cleaning Products</h3>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                <li>Phthalates</li>
                <li>Ammonia</li>
                <li>Chlorine Bleach</li>
                <li>Triclosan</li>
                <li>Synthetic Fragrances</li>
                <li>Quaternary Ammonium Compounds</li>
              </ul>
            </div>
            <div className="bg-orange-50/50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3 text-orange-700">In Personal Care</h3>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                <li>Parabens</li>
                <li>Sulfates (SLS/SLES)</li>
                <li>Formaldehyde</li>
                <li>Oxybenzone</li>
                <li>Mineral Oil</li>
                <li>Synthetic Colors (FD&C)</li>
              </ul>
            </div>
          </div>
          <p className="mt-6 text-neutral-700">
            For a more comprehensive list and detailed explanations, check out our product guides and resources.
          </p>
        </>
      )
    },
    {
      id: "sustainable-living",
      title: "Sustainable Living Tips",
      description: "Simple ways to reduce your environmental impact",
      content: (
        <>
          <p className="mb-6 text-neutral-700">
            Small changes can make a big difference in reducing your environmental footprint.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-green-50/50 p-5 rounded-lg flex flex-col">
              <div className="flex items-center mb-3">
                <Leaf className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-green-700">Reduce Waste</h3>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                <li>Use reusable shopping bags</li>
                <li>Choose products with less packaging</li>
                <li>Start composting food scraps</li>
                <li>Buy in bulk when possible</li>
              </ul>
            </div>
            <div className="bg-blue-50/50 p-5 rounded-lg flex flex-col">
              <div className="flex items-center mb-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-blue-700">Save Energy</h3>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                <li>Switch to LED light bulbs</li>
                <li>Unplug devices when not in use</li>
                <li>Wash clothes in cold water</li>
                <li>Use smart power strips</li>
              </ul>
            </div>
            <div className="bg-amber-50/50 p-5 rounded-lg flex flex-col">
              <div className="flex items-center mb-3">
                <Search className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-medium text-amber-700">Shop Consciously</h3>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                <li>Buy local when possible</li>
                <li>Choose organic when you can</li>
                <li>Support eco-friendly brands</li>
                <li>Consider secondhand options</li>
              </ul>
            </div>
          </div>
        </>
      )
    }
  ];

  const faqs: FAQ[] = [
    {
      question: "What makes a product truly 'clean' or 'healthy'?",
      answer: "A truly clean or healthy product is one that's made with non-toxic, environmentally friendly ingredients that are safe for human health and the planet. These products typically avoid harmful chemicals like parabens, phthalates, and synthetic fragrances. They often have transparent ingredient lists and are backed by third-party certifications that verify their safety claims."
    },
    {
      question: "Are natural products always better than synthetic ones?",
      answer: "Not necessarily. While many natural ingredients are excellent, some natural substances can be irritating or even toxic. Conversely, some synthetic ingredients are specifically designed to be gentle and effective. What matters most is the safety profile of each specific ingredient, not whether it's natural or synthetic. We evaluate products based on scientific evidence about their ingredients' safety, not just their origin."
    },
    {
      question: "How do I know if a product is truly organic?",
      answer: "Look for credible third-party certifications like USDA Organic, which ensures that at least 95% of ingredients are organically produced. Be cautious of vague claims like 'made with organic ingredients,' which might mean only a small percentage of ingredients are actually organic. Check the ingredients list to see which specific ingredients are organic."
    },
    {
      question: "What's the difference between 'fragrance-free' and 'unscented'?",
      answer: "Fragrance-free means a product contains no added fragrance compounds. Unscented typically means the product may contain fragrance compounds used to mask the natural smell of other ingredients, resulting in a product that appears to have no scent. If you're sensitive to fragrances, look specifically for 'fragrance-free' products."
    },
    {
      question: "Are expensive products always better?",
      answer: "Price doesn't always correlate with quality or safety. Some affordable brands make excellent, clean products, while some expensive products may contain potentially harmful ingredients. We recommend focusing on the ingredients list and certifications rather than price point when evaluating a product's quality and safety."
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="inline-block px-3 py-1 rounded-full text-primary-700 bg-primary-50 text-sm font-medium mb-3">
          Clean Bee Learning Center
        </span>
        <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl mb-4">
          Learn About Clean, Healthy Living
        </h1>
        <p className="text-xl text-neutral-600">
          Discover guides, tips, and resources to help you make informed choices about the products you use.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guides" className="text-base">
            <BookOpen className="h-4 w-4 mr-2" />
            Guides
          </TabsTrigger>
          <TabsTrigger value="faqs" className="text-base">
            <Lightbulb className="h-4 w-4 mr-2" />
            FAQs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="guides" className="mt-6">
          <div className="space-y-8">
            {guides.map((guide) => (
              <Card key={guide.id} className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle>{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {guide.content}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="faqs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Common questions about clean and healthy products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-base font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-700 break-words">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearnPage;