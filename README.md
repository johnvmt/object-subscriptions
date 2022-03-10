# object-subscriptions
Nested object with mutations and subscribers

# Examples

    import {NestedObjectWithSubscriptions} from "object-subscriptions";
    
    const obj = new NestedObjectWithSubscriptions();
    
    obj.set("aa.bb", 123);
    obj.set("cc.dd", 123);
    
    obj.calculate(["aa.bb", "cc.dd"], "ee.ff", (a, b) => {
        return a + b;
    })
    
    obj.subscribe("ee.ff", (value) => {
        console.log("VAL!", value);
    });