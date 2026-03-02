import { useEffect, useRef } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useChatNotifications = () => {
    const navigate = useNavigate();

    const startTimeRef = useRef(Timestamp.now());
    const notifiedIds = useRef(new Set());

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!user) {return;}


            const q = query(
                collection(db, "messages"),
                where("receiverId", "==", user.uid)
            );

            const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const message = change.doc.data();


                        const messageTime = message.timestamp instanceof Timestamp ? message.timestamp : null;

                        if (messageTime && messageTime.toMillis() > startTimeRef.current.toMillis()) {


                            const msgId = change.doc.id;
                            if (notifiedIds.current.has(msgId)) {return;}
                            notifiedIds.current.add(msgId);


                            const activeSection = localStorage.getItem("ZYNC-active-section");

                            if (activeSection !== "Chat") {
                                toast(message.senderName || "New Message", {
                                    description: message.text ? (message.text.length > 50 ? message.text.substring(0, 50) + "..." : message.text) : "Sent a file/image",
                                    duration: 3000,
                                    action: {
                                        label: "Open Chat",
                                        onClick: () => {
                                            localStorage.setItem("ZYNC-active-section", "Chat");


                                            const event = new CustomEvent("ZYNC-open-chat", {
                                                detail: {
                                                    uid: message.senderId,
                                                    displayName: message.senderName,
                                                    photoURL: message.senderPhotoURL
                                                }
                                            });
                                            window.dispatchEvent(event);

                                            navigate("/dashboard");
                                        },
                                    },
                                });
                            }
                        }
                    }
                });
            }, (error) => {
                console.error("Notification Error:", error);
            });

            return () => {
                unsubscribeSnapshot();
            };
        });

        return () => unsubscribeAuth();
    }, [navigate]);
};
