const fs = require('fs');
let file = fs.readFileSync('src/pages/InterviewGateway.tsx', 'utf8');
file = file.replace("  }\n  const { addToast } = useToast();\n  const navigate = useNavigate();\n  const location = useLocation();\n  }, [activeSession]);", 
`  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (activeSession?.locked && activeSession?.status === 'active') {
      setCurrentView('session');
    }
  }, [activeSession]);`);
fs.writeFileSync('src/pages/InterviewGateway.tsx', file);
