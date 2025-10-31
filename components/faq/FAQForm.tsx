import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { FAQ, CreateFAQPayload, UpdateFAQPayload } from '@/types/faq';
import DateTimePicker from '@react-native-community/datetimepicker';

const categories = [
  'general',
  'account',
  'appointments',
  'payments',
  'technical',
  'patient',
  'doctor',
  'prescriptions',
  'medical_records'
];

const forRoles = [
  'patient',
  'doctor',
  'admin',
  'staff'
];

interface FAQFormProps {
  initialData?: FAQ;
  onSubmit: (data: CreateFAQPayload | UpdateFAQPayload) => Promise<void>;
  isSubmitting: boolean;
  allFAQs?: FAQ[]; // For related FAQs selection
}

const FAQForm: React.FC<FAQFormProps> = ({ initialData, onSubmit, isSubmitting, allFAQs = [] }) => {
  const [formData, setFormData] = useState<CreateFAQPayload>({
    question: '',
    shortAnswer: '',
    answer: '',
    category: 'general',
    forRoles: [],
    tags: [],
    isActive: true,
    isFeatured: false,
    metaTitle: '',
    metaDescription: '',
    publishedAt: new Date().toISOString(),
    expiresAt: undefined,
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'publishedAt' | 'expiresAt' | null>(null);
  const [relatedFAQs, setRelatedFAQs] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        question: initialData.question,
        shortAnswer: initialData.shortAnswer || '',
        answer: initialData.answer,
        category: initialData.category || 'general',
        forRoles: initialData.forRoles || [],
        tags: initialData.tags || [],
        isActive: initialData.isActive ?? true,
        isFeatured: initialData.isFeatured ?? false,
        metaTitle: initialData.metaTitle || '',
        metaDescription: initialData.metaDescription || '',
        publishedAt: initialData.publishedAt ? new Date(initialData.publishedAt) : new Date(),
        expiresAt: initialData.expiresAt ? new Date(initialData.expiresAt) : null,
      });
      if (initialData.relatedFAQs) {
        setRelatedFAQs(initialData.relatedFAQs.map(faq => typeof faq === 'string' ? faq : faq._id));
      }
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    }
    
    if (!formData.shortAnswer.trim()) {
      newErrors.shortAnswer = 'Short answer is required';
    }
    
    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.expiresAt && formData.expiresAt < formData.publishedAt) {
      newErrors.expiresAt = 'Expiration date must be after publication date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const dataToSubmit = {
        ...formData,
        relatedFAQs,
        tags: formData.tags.map(tag => tag.trim()).filter(Boolean)
      };
      
      await onSubmit(dataToSubmit);
      showToast(
        initialData ? 'FAQ updated successfully' : 'FAQ created successfully',
        'success'
      );
      router.back();
    } catch (error) {
      console.error('Error submitting FAQ:', error);
      showToast('Failed to save FAQ', 'error');
    }
  };
  
  const handleAddTag = () => {
    const tag = currentTag.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setCurrentTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };
  
  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      forRoles: prev.forRoles.includes(role)
        ? prev.forRoles.filter(r => r !== role)
        : [...prev.forRoles, role]
    }));
  };
  
  const toggleRelatedFAQ = (faqId: string) => {
    setRelatedFAQs(prev => 
      prev.includes(faqId)
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };
  
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };
  
  const handleDateChange = (field: 'publishedAt' | 'expiresAt', date?: Date) => {
    if (!date) return;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'expiresAt' && date < new Date(prev.publishedAt) 
        ? prev.publishedAt 
        : date.toISOString()
    }));
  };

  return (
    <ScrollView className="flex-1 bg-white px-4 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          Question <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`border ${errors.question ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 text-base font-sans`}
          placeholder="Enter question"
          value={formData.question}
          onChangeText={(text) => 
            setFormData({ ...formData, question: text })
          }
          multiline
          numberOfLines={2}
        />
        {errors.question && (
          <Text className="text-red-500 text-xs font-sans mt-1">
            {errors.question}
          </Text>
        )}
      </View>

      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          Answer <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`border ${errors.answer ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 text-base font-sans min-h-[120px]`}
          placeholder="Enter detailed answer"
          value={formData.answer}
          onChangeText={(text) => 
            setFormData({ ...formData, answer: text })
          }
          multiline
          textAlignVertical="top"
        />
        {errors.answer && (
          <Text className="text-red-500 text-xs font-sans mt-1">
            {errors.answer}
          </Text>
        )}
      </View>

      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          Short Answer <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`border ${errors.shortAnswer ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 text-base font-sans`}
          placeholder="Enter a brief answer (visible in lists)"
          value={formData.shortAnswer}
          onChangeText={(text) => 
            setFormData({ ...formData, shortAnswer: text })
          }
          multiline
          numberOfLines={2}
        />
        {errors.shortAnswer && (
          <Text className="text-red-500 text-xs font-sans mt-1">
            {errors.shortAnswer}
          </Text>
        )}
      </View>

      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-2">
          Category <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row flex-wrap">
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setFormData({ ...formData, category })}
              className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                formData.category === category 
                  ? 'bg-primary' 
                  : 'bg-gray-100'
              }`}
            >
              <Text 
                className={`text-sm font-sans ${
                  formData.category === category 
                    ? 'text-white' 
                    : 'text-gray-700'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category && (
          <Text className="text-red-500 text-xs font-sans mt-1">
            {errors.category}
          </Text>
        )}
      </View>
      
      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-2">
          Visible to Roles
        </Text>
        <View className="flex-row flex-wrap">
          {forRoles.map((role) => (
            <TouchableOpacity
              key={role}
              onPress={() => toggleRole(role)}
              className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                formData.forRoles.includes(role)
                  ? 'bg-primary' 
                  : 'bg-gray-100'
              }`}
            >
              <Text 
                className={`text-sm font-sans ${
                  formData.forRoles.includes(role)
                    ? 'text-white' 
                    : 'text-gray-700'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-2">
          Tags
        </Text>
        <View className="flex-row flex-wrap items-center mb-2">
          <TextInput
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 text-base font-sans"
            placeholder="Add a tag and press enter"
            value={currentTag}
            onChangeText={setCurrentTag}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
          />
          <TouchableOpacity 
            onPress={handleAddTag}
            className="bg-primary px-4 py-2 rounded-r-lg h-10 justify-center"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap">
          {formData.tags.map((tag) => (
            <View key={tag} className="bg-gray-100 rounded-full px-3 py-1 flex-row items-center mr-2 mb-2">
              <Text className="text-sm text-gray-700 mr-1">{tag}</Text>
              <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
      
      {allFAQs && allFAQs.length > 0 && (
        <View className="mb-6">
          <Text className="text-sm font-sans-medium text-gray-700 mb-2">
            Related FAQs
          </Text>
          <View className="border border-gray-300 rounded-lg p-2 max-h-40">
            <ScrollView>
              {allFAQs.filter(faq => faq._id !== initialData?._id).map(faq => (
                <TouchableOpacity
                  key={faq._id}
                  onPress={() => toggleRelatedFAQ(faq._id)}
                  className="flex-row items-center py-2 px-1 border-b border-gray-100"
                >
                  <View className={`w-5 h-5 rounded border ${relatedFAQs.includes(faq._id) ? 'bg-primary border-primary' : 'border-gray-400'} mr-2 items-center justify-center`}>
                    {relatedFAQs.includes(faq._id) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>
                    {faq.question}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
      
      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-2">
          Publication Date
        </Text>
        <TouchableOpacity 
          onPress={() => setShowDatePicker('publishedAt')}
          className="border border-gray-300 rounded-lg px-4 py-3"
        >
          <Text className="text-gray-700">
            {formatDate(formData.publishedAt)}
          </Text>
        </TouchableOpacity>
        {showDatePicker === 'publishedAt' && (
          <DateTimePicker
            value={new Date(formData.publishedAt)}
            mode="datetime"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(null);
              handleDateChange('publishedAt', date);
            }}
          />
        )}
      </View>
      
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-sans-medium text-gray-700">
            Expiration Date (Optional)
          </Text>
          <TouchableOpacity 
            onPress={() => setFormData({ 
              ...formData, 
              expiresAt: formData.expiresAt ? undefined : new Date().toISOString() 
            })}
            className="px-3 py-1 bg-gray-100 rounded-full"
          >
            <Text className="text-xs text-gray-600">
              {formData.expiresAt ? 'Remove' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
        {formData.expiresAt ? (
          <>
            <TouchableOpacity 
              onPress={() => setShowDatePicker('expiresAt')}
              className="border border-gray-300 rounded-lg px-4 py-3"
            >
              <Text className="text-gray-700">
                {formatDate(formData.expiresAt)}
              </Text>
            </TouchableOpacity>
            {showDatePicker === 'expiresAt' && formData.expiresAt && (
              <DateTimePicker
                value={new Date(formData.expiresAt)}
                mode="datetime"
                display="default"
                minimumDate={new Date(formData.publishedAt)}
                onChange={(event, date) => {
                  setShowDatePicker(null);
                  handleDateChange('expiresAt', date);
                }}
              />
            )}
          </>
        ) : (
          <View className="border border-dashed border-gray-300 rounded-lg p-4 items-center">
            <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
            <Text className="text-gray-500 text-sm mt-1">No expiration date set</Text>
          </View>
        )}
        {errors.expiresAt && (
          <Text className="text-red-500 text-xs font-sans mt-1">
            {errors.expiresAt}
          </Text>
        )}
      </View>
      
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-sm font-sans-medium text-gray-700 mb-1">
            Status
          </Text>
          <Text className="text-xs text-gray-500">
            {formData.isActive ? 'Visible to users' : 'Hidden from users'}
          </Text>
        </View>
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`flex-row items-center h-10 rounded-full px-4 ${
              formData.isActive ? 'bg-green-100' : 'bg-gray-200'
            }`}
          >
            <View 
              className={`w-5 h-5 rounded-full mr-2 items-center justify-center ${
                formData.isActive ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
            <Text className="text-sm font-sans-medium">
              {formData.isActive ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
            className={`flex-row items-center h-10 rounded-full px-4 ${
              formData.isFeatured ? 'bg-amber-100' : 'bg-gray-200'
            }`}
          >
            <Ionicons 
              name={formData.isFeatured ? 'star' : 'star-outline'} 
              size={18} 
              color={formData.isFeatured ? '#D97706' : '#6B7280'}
              className="mr-1"
            />
            <Text 
              className={`text-sm font-sans-medium ${
                formData.isFeatured ? 'text-amber-700' : 'text-gray-600'
              }`}
            >
              Featured
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-2">
          SEO Title
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base font-sans"
          placeholder="SEO title (leave blank to use question)"
          value={formData.metaTitle}
          onChangeText={(text) => 
            setFormData({ ...formData, metaTitle: text })
          }
        />
        <Text className="text-xs text-gray-500 mt-1">
          {formData.metaTitle ? formData.metaTitle.length : 0} / 60 characters
        </Text>
      </View>
      
      <View className="mb-8">
        <Text className="text-sm font-sans-medium text-gray-700 mb-2">
          SEO Description
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base font-sans h-24"
          placeholder="SEO description (leave blank to use short answer)"
          value={formData.metaDescription}
          onChangeText={(text) => 
            setFormData({ ...formData, metaDescription: text })
          }
          multiline
          textAlignVertical="top"
        />
        <Text className="text-xs text-gray-500 mt-1">
          {formData.metaDescription ? formData.metaDescription.length : 0} / 160 characters
        </Text>
      </View>

      <View className="flex-row gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-1 bg-white border border-gray-300 rounded-xl py-3 items-center"
          disabled={isSubmitting}
        >
          <Text className="text-gray-700 font-sans-medium">
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          className="flex-1 bg-primary rounded-xl py-3 items-center flex-row justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="white" />
              <Text className="text-white font-sans-medium ml-2">
                {initialData ? 'Update' : 'Save'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default FAQForm;
