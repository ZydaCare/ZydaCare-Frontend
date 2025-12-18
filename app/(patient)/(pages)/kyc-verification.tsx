import { getKYCStatus, KYCStatus, submitKYCDocuments } from '@/api/patient/user';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/authContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

type VerificationDocument = {
    id: string;
    type: 'id' | 'selfie' | 'proof_of_address';
    title: string;
    description: string;
    icon: string;
    status: 'pending' | 'verified' | 'rejected' | 'not_submitted';
    imageUri?: string;
};

export default function KYCVerificationScreen() {
    const { user, isAuthenticated } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated]);

    const [documents, setDocuments] = useState<VerificationDocument[]>([
        {
            id: '1',
            type: 'id',
            title: 'Government ID',
            description: 'Upload a valid government-issued ID (Passport, Driver\'s License, National ID)',
            icon: 'id-card',
            status: 'not_submitted',
        },
        {
            id: '2',
            type: 'selfie',
            title: 'Selfie',
            description: 'Take a selfie for identity verification',
            icon: 'camera-reverse',
            status: 'not_submitted',
        },
        {
            id: '3',
            type: 'proof_of_address',
            title: 'Proof of Address',
            description: 'Upload a utility bill or bank statement (not older than 3 months)',
            icon: 'home',
            status: 'not_submitted',
        },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [documentType, setDocumentType] = useState('passport');
    const [documentNumber, setDocumentNumber] = useState('');
    const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                setToken(storedToken);
            } catch (error) {
                console.error('Error loading token:', error);
            }
        };

        loadToken();
    }, []);


    useEffect(() => {
        const checkKYCStatus = async () => {
            if (!token) return;

            try {
                setIsLoading(true);
                const status = await getKYCStatus(token);
                setKycStatus(status);

                if (status.status === 'approved') {
                    setDocuments(docs =>
                        docs.map(doc => ({
                            ...doc,
                            status: 'verified' as const
                        }))
                    );
                }
            } catch (error) {
                console.error('Error checking KYC status:', error);
                showToast('Failed to check KYC status', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        checkKYCStatus();
    }, [token]);

    const handleDocumentUpload = async (type: VerificationDocument['type']) => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                showToast('Please allow access to your photos to upload documents', 'error');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setDocuments(docs =>
                    docs.map(doc =>
                        doc.type === type
                            ? { ...doc, imageUri: result.assets[0].uri, status: 'pending' as const }
                            : doc
                    )
                );
                showToast('Document uploaded successfully', 'success');
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            showToast('Failed to upload document', 'error');
        }
    };

    const handleSelfieCapture = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                showToast('Please allow camera access to take a selfie', 'error');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setDocuments(docs =>
                    docs.map(doc =>
                        doc.type === 'selfie'
                            ? { ...doc, imageUri: result.assets[0].uri, status: 'pending' as const }
                            : doc
                    )
                );
                showToast('Selfie captured successfully', 'success');
            }
        } catch (error) {
            console.error('Error capturing selfie:', error);
            showToast('Failed to capture selfie', 'error');
        }
    };

    const handleSubmit = async () => {
        const uploadedDocs = documents.filter(doc => doc.status !== 'not_submitted');
        if (uploadedDocs.length < documents.length) {
            showToast('Please upload all required documents', 'error');
            return;
        }

        if (!documentNumber.trim()) {
            showToast('Please enter your document number', 'error');
            return;
        }

        try {
            setIsSubmitting(true);

            const docImage = documents.find(doc => doc.type === 'id');
            const selfie = documents.find(doc => doc.type === 'selfie');
            const proofAddress = documents.find(doc => doc.type === 'proof_of_address');

            if (!docImage?.imageUri || !selfie?.imageUri || !proofAddress?.imageUri) {
                throw new Error('Missing required documents');
            }

            if (!token) {
                throw new Error('Authentication required');
            }

            const result = await submitKYCDocuments(
                token,
                documentType,
                documentNumber,
                { uri: docImage.imageUri },
                { uri: selfie.imageUri },
                { uri: proofAddress.imageUri }
            );

            if (result.success) {
                showToast('Verification submitted successfully', 'success');
                setKycStatus({
                    status: 'pending',
                    submittedAt: new Date().toISOString()
                });
                router.back();
            }
        } catch (error: any) {
            console.error('Error submitting KYC:', error);
            showToast(error.message || 'Failed to submit verification', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render Verified Status View
    const renderVerifiedView = () => (
        <ScrollView className="flex-1 p-4">
            <View className="bg-white rounded-xl p-6 mb-6 shadow-sm items-center">
                <View className="bg-primary p-6 rounded-full mb-4">
                    <Ionicons name="checkmark-circle" size={64} color="#fff" />
                </View>
                <Text className="text-2xl font-sans-bold text-gray-900 mb-2 text-center">
                    Verification Complete
                </Text>
                <Text className="text-base text-gray-600 font-sans text-center mb-6">
                    Your identity has been successfully verified. You now have full access to all features.
                </Text>

                <View className="w-full bg-primary rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="shield-checkmark" size={20} color="#fff" />
                        <Text className="text-sm font-sans-medium text-white ml-2">Verified Documents</Text>
                    </View>
                    {documents.map((doc) => (
                        <View key={doc.id} className="flex-row items-center mb-2">
                            <Ionicons name="checkmark-circle" size={16} color="#fff" />
                            <Text className="text-sm text-white font-sans ml-2">{doc.title}</Text>
                        </View>
                    ))}
                </View>

                <View className="w-full bg-gray-50 rounded-xl p-4">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-gray-600 font-sans">Document Type</Text>
                        <Text className="text-sm font-sans-medium text-gray-900">
                            {documentType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-gray-600 font-sans">Verification Date</Text>
                        <Text className="text-sm font-sans-medium text-gray-900">
                            {kycStatus?.submittedAt ? new Date(kycStatus.submittedAt).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600 font-sans">Status</Text>
                        <View className="flex-row items-center">
                            <View className="w-2 h-2 bg-primary rounded-full mr-2" />
                            <Text className="text-sm font-sans-medium text-primary">Verified</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View className="bg-blue-50 rounded-xl p-4">
                <View className="flex-row">
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <View className="ml-2 flex-1">
                        <Text className="text-sm font-sans-medium text-blue-800 mb-1">Your Data is Secure</Text>
                        <Text className="text-xs text-blue-700 font-sans">
                            Your verified documents are encrypted and stored securely. We follow strict data protection standards.
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    // Render Pending Status View
    const renderPendingView = () => (
        <ScrollView className="flex-1 p-4">
            <View className="bg-white rounded-xl p-6 mb-6 shadow-sm items-center">
                <View className="bg-primary p-6 rounded-full mb-4">
                    <Ionicons name="time-outline" size={64} color="#fff" />
                </View>
                <Text className="text-2xl font-sans-bold text-gray-900 mb-2 text-center">
                    Verification Pending
                </Text>
                <Text className="text-base text-gray-600 font-sans text-center mb-6">
                    Your documents are currently under review. This usually takes 24-48 hours.
                </Text>

                <View className="w-full bg-primary rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="document-text" size={20} color="#fff" />
                        <Text className="text-sm font-sans-medium text-white ml-2">Submitted Documents</Text>
                    </View>
                    {documents.map((doc) => (
                        <View key={doc.id} className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center flex-1">
                                <Ionicons name="document" size={16} color="#fff" />
                                <Text className="text-sm text-white font-sans ml-2">{doc.title}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-2 h-2 bg-white rounded-full mr-2" />
                                <Text className="text-xs font-sans-medium text-white">Under Review</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View className="w-full bg-gray-50 rounded-xl p-4">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-gray-600 font-sans">Submitted On</Text>
                        <Text className="text-sm font-sans-medium text-gray-900">
                            {kycStatus?.submittedAt ? new Date(kycStatus.submittedAt).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600 font-sans">Estimated Review Time</Text>
                        <Text className="text-sm font-sans-medium text-gray-900">24-48 hours</Text>
                    </View>
                </View>
            </View>

            <View className="bg-blue-50 rounded-xl p-4 mb-6">
                <View className="flex-row">
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <View className="ml-2 flex-1">
                        <Text className="text-sm font-sans-medium text-blue-800 mb-1">What's Next?</Text>
                        <Text className="text-xs text-blue-700 font-sans">
                            Our team is carefully reviewing your documents. You'll receive a notification once the verification is complete.
                            No action is needed from you at this time.
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    // Render Rejected Status View
    const renderRejectedView = () => (
        <ScrollView className="flex-1 p-4">
            <View className="bg-white rounded-xl p-6 mb-6 shadow-sm items-center">
                <View className="bg-red-100 p-6 rounded-full mb-4">
                    <Ionicons name="close-circle" size={64} color="#EF4444" />
                </View>
                <Text className="text-2xl font-sans-bold text-gray-900 mb-2 text-center">
                    Verification Rejected
                </Text>
                <Text className="text-base text-gray-600 font-sans text-center mb-4">
                    Unfortunately, your submitted documents did not meet our verification requirements.
                </Text>

                {kycStatus?.rejectionReason && (
                    <View className="w-full bg-red-50 rounded-xl p-4 mb-4">
                        <View className="flex-row items-start">
                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            <View className="ml-2 flex-1">
                                <Text className="text-sm font-sans-medium text-red-800 mb-1">Reason for Rejection</Text>
                                <Text className="text-sm text-red-700 font-sans">{kycStatus.rejectionReason}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View className="w-full bg-yellow-50 rounded-xl p-4 mb-6">
                    <View className="flex-row">
                        <Ionicons name="bulb" size={20} color="#F59E0B" />
                        <View className="ml-2 flex-1">
                            <Text className="text-sm font-sans-medium text-yellow-800 mb-2">Tips for Resubmission</Text>
                            <Text className="text-xs text-yellow-700 font-sans mb-1">• Ensure documents are clear and not blurry</Text>
                            <Text className="text-xs text-yellow-700 font-sans mb-1">• All corners of documents must be visible</Text>
                            <Text className="text-xs text-yellow-700 font-sans mb-1">• Documents should not be older than 3 months</Text>
                            <Text className="text-xs text-yellow-700 font-sans mb-1">• Take selfie in good lighting conditions</Text>
                            <Text className="text-xs text-yellow-700 font-sans">• Ensure your face is clearly visible in selfie</Text>
                        </View>
                    </View>
                </View>

                <Text className="text-gray-900 font-sans-medium text-base mb-3 self-start">Resubmit Documents</Text>

                {/* Document Type and Number */}
                <View className="w-full mb-4">
                    <Text className="text-sm font-sans-medium text-gray-700 mb-1">Document Type</Text>
                    <View className="flex-row border border-gray-200 rounded-lg overflow-hidden">
                        {['passport', 'driving_license', 'national_id'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`flex-1 py-2 items-center ${documentType === type ? 'bg-primary/10' : 'bg-white'}`}
                                onPress={() => setDocumentType(type)}
                            >
                                <Text className={`font-sans text-xs ${documentType === type ? 'text-primary font-sans-medium' : 'text-gray-600'}`}>
                                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="w-full mb-4">
                    <Text className="text-sm font-sans-medium text-gray-700 mb-1">Document Number</Text>
                    <TextInput
                        className="border border-gray-200 rounded-lg p-3 font-sans"
                        placeholder="Enter document number"
                        value={documentNumber}
                        onChangeText={setDocumentNumber}
                    />
                </View>
            </View>

            {documents.map((doc) => (
                <View key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                    <View className="flex-row items-start mb-3">
                        <View className="bg-primary/10 p-2 rounded-lg mr-3">
                            <Ionicons name={doc.icon as any} size={20} color="#67A9AF" />
                        </View>
                        <View className="flex-1">
                            <Text className="font-sans-bold text-gray-900">{doc.title}</Text>
                            <Text className="text-sm text-gray-600 font-sans mt-1">{doc.description}</Text>
                        </View>
                    </View>

                    {doc.imageUri ? (
                        <View className="mt-2">
                            <Image
                                source={{ uri: doc.imageUri }}
                                className="w-full h-40 rounded-lg"
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    if (doc.type === 'selfie') {
                                        handleSelfieCapture();
                                    } else {
                                        handleDocumentUpload(doc.type);
                                    }
                                }}
                                className="bg-white border border-primary rounded-lg px-4 py-2 mt-2"
                            >
                                <Text className="text-primary font-sans-medium text-center">Replace Document</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                if (doc.type === 'selfie') {
                                    handleSelfieCapture();
                                } else {
                                    handleDocumentUpload(doc.type);
                                }
                            }}
                            className="border border-dashed border-gray-300 rounded-lg p-6 items-center mt-2"
                        >
                            <MaterialIcons name="cloud-upload" size={32} color="#9CA3AF" />
                            <Text className="text-gray-600 font-sans mt-2 text-center">
                                {doc.type === 'selfie' ? 'Take a selfie' : 'Upload Document'}
                            </Text>
                            <Text className="text-xs text-gray-500 font-sans mt-1 text-center">
                                {doc.type === 'selfie'
                                    ? 'Make sure your face is clearly visible'
                                    : 'JPG, PNG or PDF (max 5MB)'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            ))}

            <View className="bg-blue-50 rounded-xl p-4 mb-6">
                <View className="flex-row">
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <View className="ml-2 flex-1">
                        <Text className="text-sm font-sans-medium text-blue-800 mb-1">Need Help?</Text>
                        <Text className="text-xs text-blue-700 font-sans">
                            If you're having trouble with verification, please contact our support team for assistance.
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    // Render Initial Upload View (when no KYC status exists)
    const renderUploadView = () => (
        <ScrollView className="flex-1 p-4">
            <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
                <View className="flex-row items-center mb-4">
                    <View className="bg-primary/10 p-3 rounded-full mr-3">
                        <Ionicons name="shield-checkmark" size={24} color="#67A9AF" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-sans-bold text-gray-900">Verify Your Identity</Text>
                        <Text className="text-sm text-gray-600 font-sans">Complete your KYC to access all features</Text>
                    </View>
                </View>

                {/* Document Type and Number */}
                <View className="mb-4">
                    <Text className="text-sm font-sans-medium text-gray-700 mb-1">Document Type</Text>
                    <View className="flex-row border border-gray-200 rounded-lg overflow-hidden">
                        {['passport', 'driving_license', 'national_id'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`flex-1 py-2 items-center ${documentType === type ? 'bg-primary/10' : 'bg-white'}`}
                                onPress={() => setDocumentType(type)}
                            >
                                <Text className={`font-sans text-xs ${documentType === type ? 'text-primary font-sans-medium' : 'text-gray-600'}`}>
                                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="mb-6">
                    <Text className="text-sm font-sans-medium text-gray-700 mb-1">Document Number</Text>
                    <TextInput
                        className="border border-gray-200 rounded-lg p-3 font-sans"
                        placeholder="Enter document number"
                        value={documentNumber}
                        onChangeText={setDocumentNumber}
                    />
                </View>

                <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <View
                        className="h-full bg-primary rounded-full"
                        style={{
                            width: `${(documents.filter(d => d.status !== 'not_submitted').length / documents.length) * 100}%`
                        }}
                    />
                </View>

                <Text className="text-sm text-gray-600 font-sans text-center">
                    {documents.filter(d => d.status !== 'not_submitted').length} of {documents.length} steps completed
                </Text>
            </View>

            <Text className="text-gray-900 font-sans-medium text-base mb-3">Required Documents</Text>

            {documents.map((doc) => (
                <View key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                    <View className="flex-row items-start mb-3">
                        <View className="bg-primary/10 p-2 rounded-lg mr-3">
                            <Ionicons name={doc.icon as any} size={20} color="#67A9AF" />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-start">
                                <Text className="font-sans-bold text-gray-900">{doc.title}</Text>
                                {doc.status !== 'not_submitted' && (
                                    <View className="bg-green-100 px-2 py-1 rounded-full">
                                        <Text className="text-xs font-sans-medium text-green-700">Uploaded</Text>
                                    </View>
                                )}
                            </View>
                            <Text className="text-sm text-gray-600 font-sans mt-1">{doc.description}</Text>
                        </View>
                    </View>

                    {doc.imageUri ? (
                        <View className="mt-2">
                            <Image
                                source={{ uri: doc.imageUri }}
                                className="w-full h-40 rounded-lg"
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    if (doc.type === 'selfie') {
                                        handleSelfieCapture();
                                    } else {
                                        handleDocumentUpload(doc.type);
                                    }
                                }}
                                className="bg-white border border-primary rounded-lg px-4 py-2 mt-2"
                            >
                                <Text className="text-primary font-sans-medium text-center">Retake</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                if (doc.type === 'selfie') {
                                    handleSelfieCapture();
                                } else {
                                    handleDocumentUpload(doc.type);
                                }
                            }}
                            className="border border-dashed border-gray-300 rounded-lg p-6 items-center mt-2"
                        >
                            <MaterialIcons name="cloud-upload" size={32} color="#9CA3AF" />
                            <Text className="text-gray-600 font-sans mt-2 text-center">
                                {doc.type === 'selfie' ? 'Take a selfie' : 'Upload Document'}
                            </Text>
                            <Text className="text-xs text-gray-500 font-sans mt-1 text-center">
                                {doc.type === 'selfie'
                                    ? 'Make sure your face is clearly visible'
                                    : 'JPG, PNG or PDF (max 5MB)'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            ))}

            <View className="bg-blue-50 rounded-xl p-4 mb-6">
                <View className="flex-row">
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <View className="ml-2 flex-1">
                        <Text className="text-sm font-sans-medium text-blue-800 mb-1">Why do we need this?</Text>
                        <Text className="text-xs text-blue-700 font-sans">
                            We require identity verification to ensure the security of your account and comply with regulatory requirements.
                            Your information is encrypted and stored securely.
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <StatusBar barStyle="dark-content" />
                <View className="flex-row items-center p-4 border-b border-gray-100 bg-white">
                    <TouchableOpacity onPress={() => router.back()} className="p-2">
                        <Ionicons name="chevron-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-sans-bold flex-1 text-center mr-6">Identity Verification</Text>
                </View>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#67A9AF" />
                    <Text className="text-gray-600 font-sans mt-4">Loading verification status...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center p-4 border-b border-gray-100 bg-white pt-8">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="chevron-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-sans-bold flex-1 text-center mr-6">Identity Verification</Text>
            </View>

            {/* Render appropriate view based on KYC status */}
            {kycStatus?.status === 'approved' && renderVerifiedView()}
            {kycStatus?.status === 'pending' && renderPendingView()}
            {kycStatus?.status === 'rejected' && renderRejectedView()}
            {(!kycStatus?.status || kycStatus?.status === 'not_submitted') && renderUploadView()}

            {/* Submit Button - Only show for rejected or initial upload */}
            {(kycStatus?.status === 'rejected' || !kycStatus?.status) && (
                <View className="p-4 border-t border-gray-100 bg-white">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting || documents.some(doc => doc.status === 'not_submitted') || !documentNumber.trim()}
                        className={`rounded-full py-4 items-center ${documents.some(doc => doc.status === 'not_submitted') || !documentNumber.trim()
                                ? 'bg-gray-200'
                                : 'bg-primary'
                            }`}
                    >
                        {isSubmitting ? (
                            <View className="flex-row items-center">
                                <ActivityIndicator size="small" color="#ffffff" />
                                <Text className="text-white font-sans-medium ml-2">Submitting...</Text>
                            </View>
                        ) : (
                            <Text className="text-white font-sans-medium">
                                {kycStatus?.status === 'rejected'
                                    ? 'Resubmit for Verification'
                                    : 'Submit for Verification'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Back Button for Verified and Pending states */}
            {/* {(kycStatus?.status === 'approved' || kycStatus?.status === 'pending') && (
                <View className="p-4 border-t border-gray-100 bg-white">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="rounded-full py-4 items-center bg-gray-100"
                    >
                        <Text className="text-gray-700 font-sans-medium">Back to Profile</Text>
                    </TouchableOpacity>
                </View>
            )} */}
        </SafeAreaView>
    );
}