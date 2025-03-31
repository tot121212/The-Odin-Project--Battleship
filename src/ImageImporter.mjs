import { Module } from "webpack";

class SVG{
    /**
     * @param {any} r
     */
    static importAllImages(r){
        const images = new Map;
        r.keys().forEach(
            /**
             * 
             * @param {*} key 
             */
            (key)=>{
            images.set(key.replace('./',''), r(key));
        });
        return images;
    }

    /** 
     * @type {Map<string, Module>}
    */
    static PathToModule = SVG.importAllImages(require.context('../assets/', true, /\.svg$/));

    /** 
     * @type {Map<string, string>}
    */
    static NameToPath = new Map();

    static {
        for (const path in SVG.PathToModule.keys()){
            SVG.NameToPath.set(path.replace(/^\.\/|\.svg$/g, ''), path);
        }
    }
}

export default {SVG};