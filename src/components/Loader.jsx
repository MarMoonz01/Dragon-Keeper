import React from 'react';

export default function Loader({ text = "Loading..." }) {
    return <div className="ld"><div className="ldd"><span /><span /><span /></div><span>{text}</span></div>;
}
