
import React from 'react';

interface LoadingOverlayProps {
    text: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ text }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
            <div className="spinner mb-4"></div>
            <p className="text-xl text-yellow-200 title-font">{text}</p>
        </div>
    );
};

export default LoadingOverlay;
