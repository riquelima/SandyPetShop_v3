const fs = require('fs');

let content = fs.readFileSync('src/components/ClientLoginView.tsx', 'utf8');

// Find where daycare ends and hotel can start
const targetStr = `                found = true;
            }`;

if (content.includes(targetStr)) {
    const hotelCode = `
            // Try hotel_registrations
            if (!found) {
                const { data: hotelDataArr } = await supabase
                    .from('hotel_registrations')
                    .select('*')
                    .or(\`tutor_phone.eq."\${rawPhone}",tutor_phone.eq."\${formatted11}",tutor_phone.eq."\${formatted10}"\`);

                if (hotelDataArr && hotelDataArr.length > 0) {
                    const first = hotelDataArr[0];
                    aggregatedData = {
                        ...aggregatedData,
                        isHotel: true,
                        hotelPets: hotelDataArr,
                        hotelData: first,
                        name: aggregatedData.name || first.tutor_name || 'Cliente'
                    };
                    if (!aggregatedData.id) aggregatedData.id = first.id;
                    if (!aggregatedData.pet_photo_url) aggregatedData.pet_photo_url = first.pet_photo_url;
                    if (!aggregatedData.pet_name) aggregatedData.pet_name = first.pet_name;
                    
                    found = true;
                }
            }`;
    
    // Replace the first occurrence of daycare ending to append hotel check
    // Wait, let's use a simpler replace strategy using string manipulation
    const parts = content.split('// Try clients');
    if (parts.length === 2) {
        content = parts[0] + hotelCode + '\n\n            // Try clients' + parts[1];
        fs.writeFileSync('src/components/ClientLoginView.tsx', content);
        console.log("ClientLoginView updated successfully");
    } else {
        console.log("Failed to split");
    }
}
