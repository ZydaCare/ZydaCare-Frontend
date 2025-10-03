import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Images } from '@/assets/Images';
import { useAuth } from '@/context/authContext';

// Mock doctor database
const doctorsDatabase = [
  {
    id: 1,
    name: "Dr. Adebayo Okonkwo",
    specialty: "General Practitioner",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
    experience: 12,
    consultationFee: 8000,
    location: "Victoria Island, Lagos",
    rating: 4.8,
    availableToday: true,
    qualifications: "MBBS, FMCP",
    about: "Experienced in treating common ailments, preventive care, and health management."
  },
  {
    id: 2,
    name: "Dr. Chioma Nwosu",
    specialty: "Pediatrician",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
    experience: 8,
    consultationFee: 10000,
    location: "Lekki, Lagos",
    rating: 4.9,
    availableToday: true,
    qualifications: "MBBS, MSc Pediatrics",
    about: "Specialized in child health, vaccinations, and developmental monitoring."
  },
  {
    id: 3,
    name: "Dr. Ibrahim Yusuf",
    specialty: "Dermatologist",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop",
    experience: 10,
    consultationFee: 12000,
    location: "Ikeja, Lagos",
    rating: 4.7,
    availableToday: false,
    qualifications: "MBBS, Derm Specialist",
    about: "Expert in skin conditions, acne treatment, and cosmetic dermatology."
  },
  {
    id: 4,
    name: "Dr. Fatima Abdullahi",
    specialty: "Cardiologist",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop",
    experience: 15,
    consultationFee: 15000,
    location: "Ikoyi, Lagos",
    rating: 4.9,
    availableToday: true,
    qualifications: "MBBS, FWACP (Cardiology)",
    about: "Specialized in heart health, hypertension, and cardiovascular diseases."
  },
  {
    id: 5,
    name: "Dr. Oluwaseun Adeyemi",
    specialty: "Gastroenterologist",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop",
    experience: 9,
    consultationFee: 13000,
    location: "Surulere, Lagos",
    rating: 4.6,
    availableToday: true,
    qualifications: "MBBS, FMCP (Gastro)",
    about: "Expert in digestive system disorders, stomach issues, and liver health."
  }
];

// Enhanced AI Response Logic with conversational flow
const getAIResponse = (userMessage:any, conversationHistory:any) => {
  const message = userMessage.toLowerCase();
  const lastMessage = conversationHistory[conversationHistory.length - 1];
  
  // Symptom-to-specialty mapping
  const symptomKeywords = {
    fever: ['General Practitioner'],
    headache: ['General Practitioner'],
    cough: ['General Practitioner'],
    "sore throat": ['General Practitioner'],
    cold: ['General Practitioner'],
    flu: ['General Practitioner'],
    "stomach ache": ['Gastroenterologist', 'General Practitioner'],
    "stomach pain": ['Gastroenterologist', 'General Practitioner'],
    diarrhea: ['Gastroenterologist', 'General Practitioner'],
    vomiting: ['Gastroenterologist', 'General Practitioner'],
    nausea: ['Gastroenterologist', 'General Practitioner'],
    "chest pain": ['Cardiologist', 'General Practitioner'],
    palpitations: ['Cardiologist'],
    "high blood pressure": ['Cardiologist'],
    hypertension: ['Cardiologist'],
    "heart": ['Cardiologist'],
    rash: ['Dermatologist'],
    acne: ['Dermatologist'],
    itching: ['Dermatologist'],
    "skin problem": ['Dermatologist'],
    eczema: ['Dermatologist'],
    "skin rash": ['Dermatologist'],
    child: ['Pediatrician'],
    baby: ['Pediatrician'],
    toddler: ['Pediatrician'],
    infant: ['Pediatrician'],
    diabetes: ['General Practitioner', 'Cardiologist'],
    "back pain": ['General Practitioner'],
    fatigue: ['General Practitioner'],
    tired: ['General Practitioner'],
    weakness: ['General Practitioner']
  };

  // Detect symptoms and find matching specialty
  let detectedSpecialties = new Set();
  let detectedSymptoms = [];
  
  for (const [symptom, specialties] of Object.entries(symptomKeywords)) {
    if (message.includes(symptom)) {
      detectedSymptoms.push(symptom);
      specialties.forEach(s => detectedSpecialties.add(s));
    }
  }

  // Greeting responses
  if (message.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)/)) {
    return {
      text: "Hello! How are you feeling today? I'm here to help with any health concerns you might have. Feel free to describe your symptoms in detail, and I'll do my best to provide helpful guidance.",
      doctors: [],
      askFollowUp: false
    };
  }

  // Thank you responses
  if (message.match(/(thank|thanks|appreciate)/)) {
    return {
      text: "You're welcome! Is there anything else you'd like to know about your symptoms or general health? I'm here to help!",
      doctors: [],
      askFollowUp: false
    };
  }

  // Follow-up questions about duration
  if (message.match(/how long|duration|since when|started/i) && lastMessage?.role === 'assistant' && lastMessage?.askFollowUp) {
    return {
      text: "Understanding the duration helps determine the severity. If symptoms persist beyond a few days or worsen, it's important to seek medical attention. Would you like me to recommend a doctor who can properly assess your condition?",
      doctors: [],
      askFollowUp: false
    };
  }

  // If symptoms detected - provide detailed conversational help
  if (detectedSymptoms.length > 0) {
    const specialtyList = Array.from(detectedSpecialties);
    const recommendedDoctors = doctorsDatabase.filter(doc => 
      specialtyList.includes(doc.specialty)
    );

    let responseText = "";

    // Specific conversational advice based on symptoms
    if (detectedSymptoms.some(s => ['fever', 'cough', 'sore throat', 'cold', 'flu'].includes(s))) {
      responseText = `I understand you're experiencing ${detectedSymptoms.filter(s => ['fever', 'cough', 'sore throat', 'cold', 'flu'].includes(s)).join(' and ')}. This is quite common, especially during weather changes.\n\nHere's what I recommend:\n\n💧 **Stay Hydrated**: Drink plenty of water, warm tea with honey, or warm lemon water. This helps thin mucus and soothes your throat.\n\n🛏️ **Rest Well**: Your body needs energy to fight off the infection. Try to get 7-9 hours of sleep.\n\n🌡️ **Monitor Temperature**: If you have a fever above 38.5°C (101.3°F) that persists for more than 3 days, you should see a doctor.\n\n🍲 **Eat Light**: Chicken soup, fruits rich in Vitamin C (oranges, guava), and easily digestible foods.\n\n⚠️ **Red Flags**: Seek immediate medical attention if you experience difficulty breathing, persistent high fever, or chest pain.\n\nHow long have you been experiencing these symptoms? This will help me assess whether you need to see a doctor urgently.`;
      
    } else if (detectedSymptoms.some(s => ['stomach ache', 'stomach pain', 'diarrhea', 'vomiting', 'nausea'].includes(s))) {
      responseText = `I'm sorry to hear you're dealing with ${detectedSymptoms.filter(s => ['stomach ache', 'stomach pain', 'diarrhea', 'vomiting', 'nausea'].includes(s)).join(' and ')}. Digestive issues can be really uncomfortable.\n\nLet me help you manage this:\n\n💧 **Hydration is Critical**: With diarrhea or vomiting, you lose fluids quickly. Drink ORS (Oral Rehydration Solution) or make your own: 6 teaspoons of sugar + 1/2 teaspoon of salt in 1 liter of clean water.\n\n🥘 **BRAT Diet**: Stick to Bananas, Rice, Applesauce, and Toast. These are gentle on your stomach.\n\n🚫 **Avoid These**: Spicy foods, dairy products, caffeine, alcohol, and fatty foods until you feel better.\n\n🍵 **Natural Remedies**: Ginger tea can help with nausea. Peppermint tea can soothe stomach cramps.\n\n⏰ **When to Worry**: If you notice blood in stool, severe abdominal pain, symptoms lasting more than 48 hours, signs of dehydration (dark urine, dizziness), or high fever - see a doctor immediately.\n\nHave you eaten anything unusual in the last 24 hours? Food poisoning is a common cause of these symptoms.`;
      
    } else if (detectedSymptoms.some(s => ['chest pain', 'palpitations', 'heart'].includes(s))) {
      responseText = `⚠️ I notice you mentioned ${detectedSymptoms.filter(s => ['chest pain', 'palpitations', 'heart'].includes(s)).join(' and ')}. This is something we should take seriously.\n\n**Important**: If you're experiencing severe chest pain, pain radiating to your arm or jaw, difficulty breathing, or excessive sweating, please call emergency services or go to the nearest hospital immediately. These could be signs of a heart attack.\n\nIf it's mild discomfort:\n\n😌 **Stay Calm**: Anxiety can make heart palpitations worse. Try deep breathing exercises.\n\n🧘 **Reduce Triggers**: Avoid caffeine, alcohol, and strenuous activity until you're evaluated.\n\n📝 **Track Symptoms**: Note when it happens, what you were doing, and how long it lasts.\n\nGiven the sensitive nature of cardiac symptoms, I strongly recommend seeing a cardiologist or general practitioner as soon as possible for proper evaluation. They may need to run an ECG or other tests.\n\nWould you like me to recommend a doctor who can see you today?`;
      
    } else if (detectedSymptoms.some(s => ['rash', 'acne', 'itching', 'skin problem', 'eczema', 'skin rash'].includes(s))) {
      responseText = `I see you're dealing with ${detectedSymptoms.filter(s => ['rash', 'acne', 'itching', 'skin problem', 'eczema', 'skin rash'].includes(s)).join(' and ')}. Skin issues can be frustrating, but there's usually a solution.\n\nHere's what can help:\n\n🧼 **Keep It Clean**: Wash the affected area gently with mild, unscented soap. Pat dry, don't rub.\n\n❄️ **Cool Compress**: For itching or inflammation, apply a cool, damp cloth for 15-20 minutes.\n\n🚫 **Don't Scratch**: I know it's hard, but scratching makes it worse and can cause infection. Keep nails short.\n\n🧴 **Moisturize**: Use fragrance-free, hypoallergenic lotion. For eczema, apply while skin is still damp.\n\n🔍 **Identify Triggers**: New detergent? Different soap? Certain foods? Stress? Keep track of what might be causing it.\n\n⚠️ **See a Doctor If**: The rash spreads quickly, shows signs of infection (pus, warmth, fever), is extremely painful, or doesn't improve in a week.\n\nSkin conditions often need visual examination for proper diagnosis. A dermatologist can provide targeted treatment and rule out conditions like allergies, infections, or chronic skin conditions.\n\nWould you like to see a dermatologist? I can recommend experienced ones in your area.`;
      
    } else if (detectedSymptoms.some(s => ['headache'].includes(s))) {
      responseText = `Headaches can really disrupt your day. Let me help you find some relief.\n\nHere's what you can try:\n\n💧 **Hydrate**: Dehydration is a common headache trigger. Drink 2-3 glasses of water.\n\n😴 **Rest in Dark Room**: Light sensitivity often accompanies headaches. Lie down in a quiet, dark room.\n\n❄️ **Cold/Warm Compress**: Cold pack on forehead or warm compress on neck and shoulders can help.\n\n☕ **Caffeine (Moderate)**: A small amount of caffeine can help some headaches, but don't overdo it.\n\n💆 **Gentle Massage**: Massage temples, neck, and shoulders in circular motions.\n\n⚠️ **Warning Signs**: If you have sudden severe headache (worst of your life), headache with fever and stiff neck, vision changes, confusion, or if headaches are becoming more frequent/severe - see a doctor immediately.\n\nHeadaches can be caused by stress, poor posture, eye strain, lack of sleep, or underlying conditions. If this is recurring, a doctor can help identify the root cause.\n\nAre these headaches happening frequently? Or is this a one-time thing?`;
      
    } else if (detectedSymptoms.some(s => ['child', 'baby', 'toddler', 'infant'].includes(s))) {
      responseText = `I understand your concern about your child. Children need special attention and care.\n\n👶 **Important for Children**:\n\n• Children can deteriorate quickly, so it's important to monitor them closely\n• Keep them hydrated with small, frequent sips of water or breast milk\n• Watch for signs of dehydration: dry lips, no tears when crying, fewer wet diapers\n• Monitor temperature regularly\n• Ensure they're resting adequately\n\n⚠️ **Seek Immediate Care If**:\n• High fever (above 38°C for babies under 3 months, above 39°C for older children)\n• Difficulty breathing or rapid breathing\n• Unusual drowsiness or difficulty waking\n• Refusing to drink or eat\n• Severe vomiting or diarrhea\n• Rash with fever\n• Any symptom that worries you as a parent\n\n**Trust your instincts** - if something feels wrong, it's always better to have a pediatrician check.\n\nI highly recommend consulting with a pediatrician who specializes in children's health. They're trained to handle pediatric cases with the right approach.\n\nWould you like me to recommend a pediatrician who can see your child soon?`;
    } else {
      responseText = `Thank you for sharing your symptoms (${detectedSymptoms.join(', ')}). I want to provide you with the best possible guidance.\n\nBased on what you've described, it would be beneficial to consult with a healthcare professional who can:\n\n✓ Conduct a proper physical examination\n✓ Review your complete medical history\n✓ Run necessary tests if needed\n✓ Provide a definitive diagnosis\n✓ Prescribe appropriate treatment\n\nIn the meantime, make sure to rest, stay hydrated, and avoid anything that seems to worsen your symptoms.\n\nI can connect you with qualified doctors who specialize in treating these conditions.`;
    }

    // Only add doctor recommendations after providing detailed advice
    if (recommendedDoctors.length > 0) {
      responseText += `\n\n**Available Doctors:**\nI've found ${recommendedDoctors.length} qualified ${specialtyList.join('/')} specialists who can help you. You can review their profiles below and book an appointment with the one that suits you best.`;
    }

    return {
      text: responseText,
      doctors: recommendedDoctors.slice(0, 3),
      askFollowUp: true
    };
  }

  // General health queries without specific symptoms
  if (message.match(/(help|advice|what should i do|guidance|sick|not feeling well|unwell)/)) {
    return {
      text: "I'm here to help! To provide you with the most accurate guidance, could you please tell me:\n\n• What specific symptoms are you experiencing?\n• When did they start?\n• How severe are they (mild, moderate, severe)?\n• Have you tried anything to relieve them?\n\nThe more details you provide, the better I can assist you. Don't worry, take your time to describe what you're feeling.",
      doctors: [],
      askFollowUp: false
    };
  }

  // General health query
  return {
    text: "I want to make sure I understand your concern correctly so I can provide the best guidance. Could you describe your symptoms in a bit more detail?\n\nFor example:\n• What exactly are you feeling? (pain, discomfort, unusual sensation)\n• Where do you feel it?\n• How long have you been experiencing this?\n• Is it constant or does it come and go?\n\nThis information will help me give you more specific and helpful advice.",
    doctors: [],
    askFollowUp: false
  };
};

const DoctorCard = ({ doctor, onBook }:any) => {
  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row gap-3">
        <Image 
          source={{ uri: doctor.image }} 
          className="w-20 h-20 rounded-lg"
        />
        <View className="flex-1">
          <Text className="font-sans-semibold text-base text-gray-900">{doctor.name}</Text>
          <Text className="text-primary font-sans-medium text-sm">{doctor.specialty}</Text>
          <Text className="text-gray-600 font-sans text-xs mt-1">{doctor.qualifications}</Text>
          
          <View className="flex-row items-center gap-3 mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="ribbon" size={12} color="#6B7280" />
              <Text className="text-xs font-sans text-gray-600">{doctor.experience} years</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={12} color="#FCD34D" />
              <Text className="text-xs font-sans text-gray-600">{doctor.rating}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View className="mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="cash-outline" size={16} color="#6B7280" />
            <Text className="font-sans-semibold text-sm text-gray-700">₦{doctor.consultationFee.toLocaleString()}</Text>
            <Text className="text-xs font-sans text-gray-500"> per consultation</Text>
          </View>
          {doctor.availableToday && (
            <View className="bg-primary px-2 py-1 rounded-full">
              <Text className="text-xs text-white font-medium">Available Today</Text>
            </View>
          )}
        </View>
        
        <View className="flex-row items-start gap-1 mb-3">
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text className="text-xs font-sans text-gray-600 flex-1">{doctor.location}</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => onBook(doctor)}
          className="w-full bg-secondary py-3 rounded-lg active:bg-secondary/80"
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="calendar-outline" size={18} color="white" />
            <Text className="text-white font-sans-semibold text-sm">Book Appointment</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Health = () => {
  const { user } = useAuth();
  const fullName = `${user?.firstName} ${user?.lastName}`.trim();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.firstName}! 👋\n\nI'm your ZydaCare AI Health Assistant. Think of me as your first point of contact for health concerns - I'm here to:\n\n• Listen to your symptoms\n• Provide helpful health guidance\n• Recommend appropriate specialists\n• Answer your health questions\n\nHow are you feeling today? Tell me what's bothering you, and let's figure out the best way to help you feel better.`,
      timestamp: new Date(),
      doctors: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiResponse = getAIResponse(userMessage.content, messages);
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse.text,
        timestamp: new Date(),
        doctors: aiResponse.doctors || [],
        askFollowUp: aiResponse.askFollowUp
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleBookAppointment = (doctor:any) => {
    alert(`Booking appointment with ${doctor.name}.\n\nIn the actual app, this would navigate to the booking screen.`);
    // In production: navigation.navigate('BookAppointment', { doctor });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: '#F0FDFA' }}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-2 pt-4 shadow-sm">
        <View className="flex-row items-center gap-3">
          <Image source={Images.LogoIcon} className="w-14 h-14" />
          <View>
            <Text className="text-xl font-sans-semibold text-gray-900">AI Health Assistant</Text>
            <Text className="text-sm font-sans text-gray-600">Powered by ZydaCare</Text>
          </View>
        </View>
      </View>

      {/* Messages Container */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <View key={index} className={`flex-row mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mr-2">
                <Ionicons name="chatbubble" size={18} color="white" />
              </View>
            )}
            
            <View className={`flex-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`} style={{ maxWidth: '85%' }}>
              <View className={`px-4 py-3 rounded-2xl ${
                message.role === 'user' 
                  ? 'bg-primary' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <Text className={`text-sm font-sans-medium leading-relaxed ${
                  message.role === 'user' ? 'text-white' : 'text-gray-800'
                }`}>
                  {message.content}
                </Text>
              </View>
              
              {message.doctors && message.doctors.length > 0 && (
                <View className="w-full mt-3">
                  {message.doctors.map(doctor => (
                    <DoctorCard 
                      key={doctor.id} 
                      doctor={doctor} 
                      onBook={handleBookAppointment}
                    />
                  ))}
                </View>
              )}
              
              <Text className="text-xs font-sans text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            {message.role === 'user' && (
              <View className="w-8 h-8 rounded-full ml-2 overflow-hidden">
                <Image 
                  source={{ uri: user?.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'U')}&background=67A9AF&color=fff` }} 
                  className="w-8 h-8" 
                />
              </View>
            )}
          </View>
        ))}

        {isTyping && (
          <View className="flex-row mb-4 justify-start">
            <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mr-2">
              <Ionicons name="chatbubble" size={18} color="white" />
            </View>
            <View className="bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-sm">
              <View className="flex-row gap-1">
                <View className="w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: 0.4 }} />
                <View className="w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: 0.6 }} />
                <View className="w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: 0.8 }} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View className="bg-white border-t border-gray-200 px-4 py-3 pb-24">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Describe your symptoms..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-sans bg-gray-50"
            style={{ maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-3 rounded-xl ${(!input.trim() || isTyping) ? 'bg-gray-300' : 'bg-primary active:bg-primary'}`}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-xs font-sans text-gray-500 text-center mt-2">
          This AI provides general guidance. Always consult a healthcare professional.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Health;