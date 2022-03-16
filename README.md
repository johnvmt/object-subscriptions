# object-subscriptions
Nested object with mutations and subscribers

# Examples

    import {NestedObjectWithSubscriptions} from "object-subscriptions";
    
    const obj = new NestedObjectWithSubscriptions();
    
    obj.set("aa.bb", 123);
    obj.set("cc.dd", 123);
    
    obj.calculate("ee.ff", ["aa.bb", "cc.dd"], (a, b) => {
        return a + b;
    })
    
    obj.subscribe("ee.ff", (value) => {
        console.log("VAL!", value);
    });