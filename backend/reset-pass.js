const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log("Hashing new password...");
    const hashedPassword = await bcrypt.hash('123456', 10);

    console.log("Updating database for temp@owner.com...");
    const user = await prisma.user.update({
        where: { email: 'temp@owner.com' },
        data: { password: hashedPassword }
    });

    console.log('Password reset successfully to "123456" for:', user.email);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
