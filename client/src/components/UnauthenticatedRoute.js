import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AccountContext } from '../context/AccountContext';

const UnauthenticatedRoute = ({ children }) => {
    const { account } = useContext(AccountContext);

    if (account) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default UnauthenticatedRoute;