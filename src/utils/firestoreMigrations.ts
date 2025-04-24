
import { collection, query, getDocs, writeBatch } from "firebase/firestore";

export async function removeLocationFromDocuments(db: any) {
  try {
    console.log("Starting location field cleanup...");
    
    const remindersRef = collection(db, "reminders");
    const snapshot = await getDocs(query(remindersRef));
    
    if (snapshot.empty) {
      console.log("No documents to clean up");
      return;
    }
    
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if ('location' in data) {
        batch.update(doc.ref, {
          location: null
        });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
      console.log(`Cleaned up location field from ${count} documents`);
    } else {
      console.log("No documents needed cleanup");
    }
  } catch (error) {
    console.error("Error cleaning up location field:", error);
    throw error;
  }
}
