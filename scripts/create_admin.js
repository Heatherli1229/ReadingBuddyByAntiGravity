import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxtp__JimFxU6zt6LtWi0fNrlio4q67_c",
  authDomain: "reading-buddy-c7041.firebaseapp.com",
  projectId: "reading-buddy-c7041",
  storageBucket: "reading-buddy-c7041.firebasestorage.app",
  messagingSenderId: "761499050727",
  appId: "1:761499050727:web:41ecde77cee60678717842",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function initAdmin() {
  const email = "admin@readingbuddy.local";
  const password = "admin123";
  let uid = null;

  try {
    console.log("尝试创建 admin 用户...");
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    uid = userCred.user.uid;
    console.log("创建成功，UID:", uid);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log("账号已存在，正在尝试登录获取 UID 更新身份...");
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        uid = userCred.user.uid;
      } catch (loginErr) {
        console.error("登录获取 UID 失败:", loginErr);
        process.exit(1);
      }
    } else {
      console.error("创建失败:", e);
      process.exit(1);
    }
  }

  try {
    await setDoc(doc(db, "users", uid), {
      username: "admin",
      role: "admin",
      displayName: "超级管理员"
    }, { merge: true });
    console.log("成功将 admin 角色写入 Firestore！");
    process.exit(0);
  } catch (e) {
    console.error("写入 Firestore 失败:", e);
    process.exit(1);
  }
}

initAdmin();
