import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./UserApp.css";

function UserApp() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(items);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="user-container">
      <h1>Welcome to PrintHub</h1>
      <p>Browse our services below.</p>
      <div className="user-content">
        {data.length > 0 ? (
          data.map((item) => (
            <div key={item.id} className="user-card">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>
          ))
        ) : (
          <p>No products available yet.</p>
        )}
      </div>
    </div>
  );
}

export default UserApp;
