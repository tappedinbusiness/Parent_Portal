import { firestore } from './firebase';
import type { Question, Comment } from '../types';
import firebase from 'firebase/compat/app';
import { v4 as uuidv4 } from 'uuid';

const questionsCollection = firestore.collection('parent_questions');

// Helper to convert Firestore doc to Question, handling server timestamps
const fromFirestore = (doc: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>): Question => {
    const data = doc.data()!;
    return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        comments: data.comments.map((c: any) => ({ ...c, timestamp: c.timestamp?.toDate() || new Date() }))
    } as Question;
};


export const addQuestion = async (question: Omit<Question, 'id' | 'timestamp' | 'comments' | 'upvotes'>) => {
    const newQuestion = {
        ...question,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        comments: [],
        upvotes: 0,
    };
    const docRef = await questionsCollection.add(newQuestion);
    return docRef.id;
};

export const getQuestions = async (): Promise<Question[]> => {
    const snapshot = await questionsCollection.orderBy('timestamp', 'desc').get();
    return snapshot.docs.map(fromFirestore);
};

export const getTrendingQuestions = async (): Promise<Question[]> => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const snapshot = await questionsCollection
        .where('timestamp', '>=', oneMonthAgo)
        .orderBy('timestamp', 'desc') // Firestore requires the first orderBy to be on the inequality field
        .orderBy('upvotes', 'desc')
        .limit(3)
        .get();
        
    return snapshot.docs.map(fromFirestore);
};

export const upvoteQuestion = async (questionId: string) => {
    const questionRef = questionsCollection.doc(questionId);
    await questionRef.update({
        upvotes: firebase.firestore.FieldValue.increment(1)
    });
};

export const addCommentToQuestion = async (questionId: string, commentText: string): Promise<Comment> => {
    const newComment = {
        id: uuidv4(),
        text: commentText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    const questionRef = questionsCollection.doc(questionId);
    await questionRef.update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    });
    
    // Server timestamps resolve later. Return a client-side version for immediate UI update.
    return { ...newComment, timestamp: new Date() };
};
