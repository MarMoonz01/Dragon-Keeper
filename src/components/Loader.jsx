import React from 'react';

const Loader = React.memo(function Loader({ text = "Loading..." }) {
    return <div className="ld"><div className="ldd"><span /><span /><span /></div><span>{text}</span></div>;
});

export default Loader;
