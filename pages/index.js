// pages/index.js
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Head from "next/head";
import { FiLogOut, FiSend, FiPaperclip, FiSmile } from "react-icons/fi";
import styles from "./Home.module.css";
import { useRouter } from "next/router";

export default function Home() {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [otherUser, setOtherUser] = useState([]);
  const [messages, setMessages] = useState([]);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef(null);
  const [userDetails, setUserDetails] = useState({});

  // Fetch messages from API
  useEffect(() => {
    let intervalId;

    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/messages");
        if (response.ok) {
          const data = await response.json();
          const updatedMessages = messages.map(msg => ({
            ...msg,
            isCurrentUser: session.user.email === msg.email
          }));          
          setMessages(data);

          // Fetch user details for each message
          const emailSet = new Set(data.map((msg) => msg.email));
          for (const email of emailSet) {
            if (email) {
              const userResponse = await fetch(`/api/user?email=${email}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                setUserDetails((prevDetails) => ({
                  ...prevDetails,
                  [email]: {
                    name: userData.name,
                    image: userData.image,
                  },
                }));
              }
            }
          }
        } else {
          console.error("Failed to fetch messages");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    // Initial fetch
    fetchMessages();
   
    // Set interval to fetch messages every 1 second
 intervalId = setInterval(fetchMessages, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this effect runs once when the component mounts

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (session?.user?.email) {
        const res = await getOtherUser(session.user.email);
        setOtherUser(res);
      }
    };
  
    fetchOtherUser();
  }, [session]);


  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    setMounted(true);
    
    // Create floating particles
    const createParticles = () => {
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;
      
      const particleCount = 20;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random size between 5px and 20px
        const size = Math.random() * 15 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        
        // Random animation duration
        particle.style.animationDuration = `${Math.random() * 10 + 5}s`;
        
        // Random delay
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        particlesContainer.appendChild(particle);
      }
    };
    
    createParticles();
  }, []);

  const handleLogin = () => {
    router.push('/api/auth/signin');
  };
  
  if (!mounted) return null;

  

  const handleSendMessage = async () => {
    console.log(session)
    if (message.trim() !== "") {
      const newMessage = {
        email: session?.user?.email ,
        message,
        timestamp: new Date().toISOString(),
        isCurrentUser: true,
      };
      
      // Optimistically update UI
      setMessages([...messages, newMessage]);
      setMessage("");
      

     try {
       await fetch("/api/send-message", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             email: session?.user?.email,
             message,
          }),
        });
       } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const updatedMessages = messages.map(msg => ({
    ...msg,
    isCurrentUser: session?.user?.email === msg.email
  }));

  
 async function getOtherUser(email) {
  try {
    const response = await fetch(`/api/getOtherUser?email=${email}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching other user:", error);
    return null;
  }
}



  if (!session) {
    return (
      <>
      <Head>
        <title>Login</title>
        <meta name="description" content="Login to GamerNetworx" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="particles" id="particles"></div>
      
      <div className="login-container">
        <div className="logo">
          <h1>Private<span>Chat</span></h1>
        </div>
        <p className="welcome-text">Just a basic chat application to solve a problem.</p>
        <button className="login-btn" onClick={handleLogin}>LOGIN</button>
      </div>
    </>
    );
  }

  return (
    <div className={styles.app}>
      <Head>
        <title>PrivateChat</title>
        <meta name="description" content="Modern chat application" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.sidebar}>
        <div className={styles.logo}>PrivateChat</div>
        <nav className={styles.navigation}>
          <button className={`${styles.navItem} ${styles.active}`}>
            <span className={styles.navText}>Chat</span>
          </button>
          
        </nav>
        <button onClick={() => signOut()} className={styles.signOutButton}>
          <FiLogOut />
          <span>Sign Out</span>
        </button>
      </div>

      <main className={styles.main}>
        <div className={styles.chatHeader}>
          <div className={styles.userInfo}>
            <img 
              src={otherUser?.image || "/avatardefault.webp"} 
              alt="Contact" 
              className={styles.userImage} 
            />
            <div className={styles.userData}>
              <div className={styles.userName}>{otherUser ? <p>{otherUser?.name}</p> : <p>N/A</p>}</div>
              {/* <div className={styles.userStatus}>
                <span className={styles.statusDot}></span>
                Active
              </div> */}
            </div>
          </div>
        </div>

        <div className={styles.chatContainer}>
          <div className={styles.messages}>
            {updatedMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`${styles.messageWrapper} ${msg.isCurrentUser ? styles.outgoing : styles.incoming}`}
              >
                {!msg.isCurrentUser && (
                  <img 
                    src={userDetails[msg.email]?.image || "/avatardefault.webp"} 
                    alt={userDetails[msg.email]?.name || "User"} 
                    className={styles.messageBubbleAvatar} 
                  />
                )}
                <div className={styles.messageContent}>
                  <div className={styles.messageBubble}>
                    {msg.message}
                  </div>
                  <div className={styles.messageTime}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputContainer}>
              {/* <button className={styles.attachButton}>
                <FiPaperclip />
              </button> */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.messageInput}
              placeholder="Type a message..."
              rows={1}
            />
            {/* <button className={styles.emojiButton}>
              <FiSmile />
            </button> */}
            <button onClick={handleSendMessage} className={styles.sendButton}>
              <FiSend />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}