import { NEWS_API_KEY } from '@/config';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { View, Text, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';

interface HealthTip {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    sourceUrl: string;
    sourceName: string;
    publishedAt: string;
}

const HealthTipsSection = () => {
    const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
    const [tipsLoading, setTipsLoading] = useState(true);

    // Fetch health articles from News API with specific health topics
    const fetchHealthTips = async () => {
        try {
            setTipsLoading(true);

            // Use multiple keyword sets to maximize results
            const queries = [
                'health tips OR wellness OR "healthy living"',
                'nutrition OR diet OR fitness OR exercise',
                'mental health OR mindfulness OR sleep health',
                'preventive care OR medicine OR therapy',
            ];

            let collectedTips: HealthTip[] = [];

            for (const query of queries) {
                // if (collectedTips.length >= 4) break; // Stop when we have at least 4

                const response = await fetch(
                    `https://newsapi.org/v2/everything?` +
                    `q=${encodeURIComponent(query)}` +
                    `&language=en` +
                    `&sortBy=publishedAt` +
                    `&pageSize=20` + // fetch more to filter from
                    `&apiKey=${NEWS_API_KEY}`
                );

                const data = await response.json();

                if (data.status === 'ok' && data.articles) {
                    const filtered = data.articles
                        .filter((article: any) => {
                            if (!article.urlToImage || !article.title || !article.description) return false;

                            const text = (article.title + ' ' + article.description).toLowerCase();
                            const healthKeywords = [
                                'health', 'wellness', 'nutrition', 'diet', 'fitness',
                                'exercise', 'sleep', 'mental', 'therapy', 'medicine',
                                'treatment', 'prevent', 'vitamin', 'protein', 'weight',
                                'immune', 'stress', 'mindfulness', 'meditation', 'yoga', 'healthy'
                            ];

                            const excludeKeywords = [
                                'death', 'war', 'politics', 'murder', 'election',
                                'lawsuit', 'crash', 'accident'
                            ];

                            const hasHealth = healthKeywords.some(k => text.includes(k));
                            const hasExcluded = excludeKeywords.some(k => text.includes(k));

                            return hasHealth && !hasExcluded;
                        })
                        .map((article: any, index: number) => ({
                            id: `${article.publishedAt}-${index}-${query}`,
                            title: article.title,
                            description: article.description,
                            imageUrl: article.urlToImage,
                            sourceUrl: article.url,
                            sourceName: article.source.name,
                            publishedAt: article.publishedAt,
                        }));

                    // Add unique new tips
                    for (const tip of filtered) {
                        if (!collectedTips.find(t => t.title === tip.title)) {
                            collectedTips.push(tip);
                            // if (collectedTips.length >= 6) break; // max 6 tips
                        }
                    }
                }
            }

            setHealthTips(collectedTips);
            // console.log(`✅ Total collected health tips: ${collectedTips.length}`);
        } catch (error) {
            console.error('Error fetching health tips:', error);
            setHealthTips([]);
        } finally {
            setTipsLoading(false);
        }
    };

    // Fetch tips when component mounts
    useEffect(() => {
        fetchHealthTips();
    }, []); // Empty dependency array means this runs once on mount

    const handleTipPress = (tip: HealthTip) => {
        Linking.openURL(tip.sourceUrl).catch(err => console.error('Error opening URL:', err));
    }

    return (
        <View className="px-4">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-sans-semibold text-gray-800">Health Tips</Text>
                <TouchableOpacity onPress={fetchHealthTips}>
                    <Text className="text-sm font-sans text-primary">Refresh</Text>
                </TouchableOpacity>
            </View>

            {tipsLoading ? (
                <View className="flex-row justify-center py-8">
                    <ActivityIndicator size="large" color="#67A9AF" />
                </View>
            ) : healthTips.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                >
                    {healthTips.map((tip) => (
                        <TouchableOpacity
                            key={tip.id}
                            className="w-64 bg-white rounded-xl overflow-hidden mr-3 shadow-sm border border-gray-100"
                            onPress={() => handleTipPress(tip)}
                            activeOpacity={0.8}
                        >
                            <Image
                                source={{ uri: tip.imageUrl }}
                                className="w-full h-32"
                                resizeMode="cover"
                            />

                            <View className="p-4">
                                <Text className="font-sans-semibold text-gray-800 mb-2" numberOfLines={2}>
                                    {tip.title}
                                </Text>
                                <Text className="font-sans text-gray-600 text-xs mb-3" numberOfLines={3}>
                                    {tip.description}
                                </Text>

                                <View className="flex-row items-center justify-between">
                                    <Text className="font-sans text-primary text-xs">
                                        {tip.sourceName}
                                    </Text>
                                    <Ionicons name="open-outline" size={16} color="#67A9AF" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <View className="bg-white rounded-xl p-6 items-center">
                    <Ionicons name="newspaper-outline" size={48} color="#CBD5E0" />
                    <Text className="font-sans text-gray-600 text-center mt-3">
                        No health articles available at the moment
                    </Text>
                    <TouchableOpacity onPress={fetchHealthTips} className="mt-3">
                        <Text className="font-sans-semibold text-primary">Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default HealthTipsSection;